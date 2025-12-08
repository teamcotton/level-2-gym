export interface Tokenizer {
  encode(input: string): number[]
  decode(tokens: number[]): string
  count(input: string): number
}
