export default async function performRequest(url) {
  const response = await fetch(url)
  const responseObject = await response.json()
  return responseObject.data
}