export const isObjectEmpty = (input: unknown) => (typeof input === 'object' && input !== null ? !Object.keys(input).length : false);
