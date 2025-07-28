import { FileData } from './file.types';

export type RenamingSanitizer = (targetName: string, file: FileData, inputElement: HTMLInputElement) => string;
