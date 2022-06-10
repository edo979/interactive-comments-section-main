document.addEventListener('alpine:init', () => {
  Alpine.data('commentsApp', () => ({
    data: {},
    lastId: 4,

    saveReply({ id, replyMessage, replyingTo }) {
      // Create reply object
      const replyingToComment = this.data.comments
        .filter((comment) => comment.id == id)
        .pop()

      replyingToComment.replies.unshift({
        id: this.getId,
        content: replyMessage,
        createdAt: new Date(),
        score: 0,
        replyingTo,
        user: { ...this.data.currentUser },
      })

      console.log(this.data.comments)

      // new comments array
      this.data.comments = this.data.comments.map((comment) => {
        if (comment.id == id) {
          return replyingToComment
        }

        return comment
      })
    },

    get getId() {
      this.lastId++
      return this.lastId
    },
  }))
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
