const serializeObject = <T>(obj: T): T => {
  if (obj === null || obj === undefined) return obj

  return JSON.parse(JSON.stringify(obj))
}

const jsonParse = (str: string) => {
  try {
    const strObj = JSON.parse(str)
    return strObj
  } catch (e) {
    return null
  }
}

export { serializeObject, jsonParse }
