import { FileData } from './file.types';

export type SearchInputCallback = (e: React.FormEvent<HTMLInputElement>) => void;
export type CancelSearchCallback = () => void;
export type SearchPredicate = (searchPhrase: string, file: FileData) => boolean;
