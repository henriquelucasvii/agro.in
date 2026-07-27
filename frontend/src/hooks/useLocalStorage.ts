import { useCallback, useEffect, useRef, useState } from "react";

interface Envelope<T> {
    v: number;
    savedAt: number;
    data: T;
}

interface UseLocalStorageOptions<T> {
    /** Transforma o valor antes de virar JSON (padrão: identidade). */
    toJSON?: (valor: T) => unknown;
    /** Reconstrói o valor a partir do JSON lido (padrão: identidade). */
    fromJSON?: (bruto: unknown) => T;
    /** Versão do formato armazenado. Mudou o formato? Suba a versão. */
    version?: number;
    /** Tempo de vida em ms. Passado esse tempo, volta ao valor padrão. */
    ttlMs?: number;
    /** Sincroniza o valor entre abas/janelas abertas (padrão: true). */
    syncAcrossTabs?: boolean;
}

const temLocalStorage =
    typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export function useLocalStorage<T>(
    chave: string,
    valorPadrao: T | (() => T),
    opcoes: UseLocalStorageOptions<T> = {}
) {
    const {
        toJSON = (v: T) => v as unknown,
        fromJSON = (v: unknown) => v as T,
        version = 1,
        ttlMs,
        syncAcrossTabs = true,
    } = opcoes;

    const resolverPadrao = useCallback(
        (): T => (typeof valorPadrao === "function" ? (valorPadrao as () => T)() : valorPadrao),
        []
    );

    const ler = useCallback((): T => {
        if (!temLocalStorage) return resolverPadrao();
        try {
            const bruto = window.localStorage.getItem(chave);
            if (!bruto) return resolverPadrao();

            const envelope = JSON.parse(bruto) as Envelope<unknown>;
            if (!envelope || typeof envelope !== "object" || envelope.v !== version) {
                return resolverPadrao();
            }
            if (ttlMs && Date.now() - envelope.savedAt > ttlMs) {
                return resolverPadrao();
            }
            return fromJSON(envelope.data);
        } catch {
            // JSON corrompido, storage bloqueado etc. — nunca quebra a tela.
            return resolverPadrao();
        }
    }, [chave, version, ttlMs, fromJSON, resolverPadrao]);

    const [valor, setValor] = useState<T>(ler);
    const montado = useRef(false);

    const gravar = useCallback(
        (novoValor: T) => {
            if (!temLocalStorage) return;
            try {
                const envelope: Envelope<unknown> = {
                    v: version,
                    savedAt: Date.now(),
                    data: toJSON(novoValor),
                };
                window.localStorage.setItem(chave, JSON.stringify(envelope));
            } catch (erro) {
                // Quota excedida, modo privado/anônimo etc. A UI continua funcionando
                // normalmente, só não persiste — não deve derrubar a aplicação.
                console.warn(`[useLocalStorage] Não foi possível gravar "${chave}":`, erro);
            }
        },
        [chave, version, toJSON]
    );

    const atualizar = useCallback(
        (novoOuFn: T | ((atual: T) => T)) => {
            setValor((atual) => {
                const novo =
                    typeof novoOuFn === "function" ? (novoOuFn as (atual: T) => T)(atual) : novoOuFn;
                gravar(novo);
                return novo;
            });
        },
        [gravar]
    );

    const remover = useCallback(() => {
        if (temLocalStorage) {
            try {
                window.localStorage.removeItem(chave);
            } catch {
                // ignora
            }
        }
        setValor(resolverPadrao());
    }, [chave, resolverPadrao]);

    // Se a própria chave mudar dinamicamente, recarrega o valor dela.
    useEffect(() => {
        if (!montado.current) {
            montado.current = true;
            return;
        }
        setValor(ler());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chave]);

    // Mantém o valor sincronizado entre abas/janelas.
    useEffect(() => {
        if (!temLocalStorage || !syncAcrossTabs) return;
        const aoMudarStorage = (evento: StorageEvent) => {
            if (evento.key !== chave) return;
            setValor(ler());
        };
        window.addEventListener("storage", aoMudarStorage);
        return () => window.removeEventListener("storage", aoMudarStorage);
    }, [chave, syncAcrossTabs, ler]);

    return [valor, atualizar, remover] as const;
}
