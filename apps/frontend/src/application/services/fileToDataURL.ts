/**
 * @function fileToDataURL
 * @param file - The File object to convert
 * @returns A Promise that resolves to the base64-encoded data URL string
 * @throws Rejects the promise if the file cannot be read
 * @description Converts a File object to a base64-encoded data URL.
 * To allow file upload to be used in forms the following would be needed to
 * add to the form:
 *
 * ```
 *    try {
 *       const parts: Array<
 *         { type: 'text'; text: string } | { type: 'file'; mediaType: string; url: string }
 *       > = [
 *         {
 *           type: 'text',
 *           text: input,
 *         },
 *       ]
 *
 *       if (selectedFile) {
 *         parts.push({
 *           type: 'file',
 *           mediaType: selectedFile.type,
 *           url: await fileToDataURL(selectedFile),
 *         })
 *       }
 *
 *       sendMessage({ parts })
 *
 *       setInput('')
 *       setSelectedFile(null)
 *     } finally {
 *       setIsLoading(false) // Always set to false when done
 *     }
 *```
 * Plus the necessary UI to select the file.
 * and
 * ```
 * const [selectedFile, setSelectedFile] = useState<File | null>(null)
 * ```
 *
 * @param file
 */

const fileToDataURL = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('Failed to read file as data URL'))
      }
    }
    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${reader.error?.message || 'Unknown error'}`))
    }
    reader.readAsDataURL(file)
  })
}

export { fileToDataURL }
