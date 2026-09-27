export const greetings = (): string => {
  const currenthour = new Date().getHours();

  if (currenthour >= 5 && currenthour < 12) {
    return 'Good Morning';
  } 
  else if (currenthour >= 12 && currenthour < 18) {
    return 'Good Afternoon';
  }
  else if (currenthour >= 18 && currenthour < 22) {
    return 'Good Evening';
  } 
  else {
    return 'Good Night';
  }

}