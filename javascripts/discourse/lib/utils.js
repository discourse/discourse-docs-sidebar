export function normalizeName(name) {
  return name
    .normalize("NFD") // normalize the string to remove diacritics
    .replace(
      /[\u0300-\u036f]|\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu,
      ""
    ) // remove emojis and diacritics
    .toLowerCase()
    .replace(/\s|_+/g, "-") // replace spaces and underscores with dashes
    .replace(/--+/g, "-") // replace multiple dashes with a single dash
    .replace(/(^-+|-+$)/, ""); // remove trailing/leading dashes
}
