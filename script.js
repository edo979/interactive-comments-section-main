document.addEventListener('alpine:init', () => {
  Alpine.store('commentsAppData', [])
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
