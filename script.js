document.addEventListener('alpine:init', () => {
  Alpine.store('commentsApp', {
    data: {},

    saveReply(e) {
      console.log('save Reply')
    },
  })
})

async function getData() {
  // Get data from Local storage
  const dataFromLS = JSON.parse(localStorage.getItem('commentsAppData'))

  // Or load form file
  if (!dataFromLS) {
    const res = await fetch('data.json'),
      dataFromFile = await res.json()

    return dataFromFile
  }

  return dataFromLS
}
