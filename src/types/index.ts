export interface Technique {
  id: string
  title: string
  shortDescription: string
  description: string
  whenToUse: string
  example: string
  advantages: string[]
  limitations: string[]
}

export interface PromptTemplate {
  id: number | string
  title: string
  description: string
  category: string
  content: string
  author: string
  isPublic: boolean
  createdAt?: string
}

export interface TemplateFormValues {
  title: string
  description: string
  category: string
  content: string
}
