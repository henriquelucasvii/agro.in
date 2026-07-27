-- AlterTable
ALTER TABLE "Meta" ADD COLUMN     "categoria" TEXT DEFAULT 'geral',
ADD COLUMN     "responsavel" TEXT,
ADD COLUMN     "unidade" TEXT;
