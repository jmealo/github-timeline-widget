function truncateTimeToSecond(date_obj) {
  return new Date(Math.floor(date_obj.valueOf() / 1000) * 1000)
}
