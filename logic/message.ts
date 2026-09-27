
const message = [
  "Hi",
  "Welcome",

]

export const randomMessage = (): string => {

  const random = Math.floor(Math.random() * message.length);
  return message[random];

};