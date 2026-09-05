function shuffle(array: string[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export const genUUID = () => {
    const chars = "01234567890qwertyuiopasdfghjklzxcvbnm";
    const arr = shuffle(Array.from(chars));
    return arr.join("")
}