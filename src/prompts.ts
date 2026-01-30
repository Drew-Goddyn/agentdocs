import prompts from 'prompts'

export async function promptVersion(): Promise<string | null> {
  const response = await prompts({
    type: 'text',
    name: 'version',
    message: 'Enter Rails version (e.g., 7.1.3):',
    validate: (value: string) =>
      /^\d+\.\d+\.\d+/.test(value) || 'Enter a valid version (e.g., 7.1.3)',
  })

  return response.version || null
}

export async function promptConfirm(message: string): Promise<boolean> {
  const response = await prompts({
    type: 'confirm',
    name: 'confirmed',
    message,
    initial: true,
  })

  return response.confirmed ?? false
}

export async function promptOutputFile(defaultFile: string): Promise<string> {
  const response = await prompts({
    type: 'text',
    name: 'output',
    message: 'Output file:',
    initial: defaultFile,
  })

  return response.output || defaultFile
}
