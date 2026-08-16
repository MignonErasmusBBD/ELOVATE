function titleCaseWord(word: string): string {
  if (word === "") {
    return "";
  }
  const firstLetter = word.slice(0, 1).toUpperCase();
  const remainingLetters = word.slice(1).toLowerCase();
  return `${firstLetter}${remainingLetters}`;
}

export function displayCodeLabel(code: string): string {
  return code
    .split(/[_-]+/)
    .filter((part) => part !== "")
    .map(titleCaseWord)
    .join(" ");
}

export function displayRoleName(roleName: string): string {
  if (roleName === "org_admin") {
    return "Org Admin";
  }
  if (roleName === "platform_admin") {
    return "Platform Admin";
  }
  if (roleName === "community_admin") {
    return "Community Admin";
  }
  if (roleName === "educator") {
    return "Educator";
  }
  if (roleName === "learner") {
    return "Learner";
  }
  return displayCodeLabel(roleName);
}

export function displayFormatCode(formatCode: string): string {
  if (formatCode === "mcq") {
    return "Multiple choice";
  }
  if (formatCode === "true_false") {
    return "True or false";
  }
  if (formatCode === "short_answer") {
    return "Short answer";
  }
  return displayCodeLabel(formatCode);
}
