import { ImageOff, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "../lib/api";

export default function FotoAnaliseProtegida({
    analiseId,
    alt,
    className = "",
}: {
    analiseId: number;
    alt: string;
    className?: string;
}) {
    const [url, setUrl] = useState("");
    const [erro, setErro] = useState(false);

    useEffect(() => {
        let ativo = true;
        let objetoUrl = "";

        void api
            .get<Blob>(`/analise-foliar/${analiseId}/imagem`, {
                responseType: "blob",
            })
            .then(({ data }) => {
                if (!ativo) return;
                objetoUrl = URL.createObjectURL(data);
                setUrl(objetoUrl);
            })
            .catch(() => {
                if (ativo) setErro(true);
            });

        return () => {
            ativo = false;
            if (objetoUrl) URL.revokeObjectURL(objetoUrl);
        };
    }, [analiseId]);

    if (erro) {
        return (
            <div className={`flex items-center justify-center bg-[#E8ECE5] ${className}`}>
                <ImageOff size={20} className="text-[#7A877A]" />
            </div>
        );
    }
    if (!url) {
        return (
            <div className={`flex items-center justify-center bg-[#E8ECE5] ${className}`}>
                <LoaderCircle size={20} className="animate-spin text-[#4B7152]" />
            </div>
        );
    }
    return <img src={url} alt={alt} className={`object-cover ${className}`} />;
}
