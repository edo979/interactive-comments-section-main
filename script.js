document.addEventListener('alpine:init', () => {
  Alpine.data('commentsApp', () => ({
    data: {},

    saveReply({ id, replyMessage, replyingTo }) {
      // Create reply object
      const replyingToComment = this.data.comments
        .filter((comment) => comment.id == id)
        .pop()

      replyingToComment.replies.unshift({
        id: this.getId,
        content: replyMessage.replace(`@${replyingTo} `, ''),
        createdAt: new Date().toString(),
        score: 0,
        replyingTo,
        user: { ...this.data.currentUser },
      })

      this.saveData(replyingToComment, id)
    },

    saveReplyToReply({ id, replyMessage, replyingTo, parrentCommentId }) {
      // get parrent comment, create reply object, get index of replying reply
      const replyingToComment = this.data.comments
          .filter((comment) => comment.id == parrentCommentId)
          .pop(),
        newReply = {
          id: this.getId,
          content: replyMessage.replace(`@${replyingTo} `, ''),
          createdAt: new Date().toString(),
          score: 0,
          replyingTo,
          user: { ...this.data.currentUser },
        },
        indexOfParrentReply = replyingToComment.replies.findIndex(
          (el) => el.id == id
        )

      // post reply after reply
      replyingToComment.replies.splice(indexOfParrentReply + 1, 0, newReply)

      this.saveData(replyingToComment, id)
    },

    saveData(replyingToComment, id) {
      this.data.comments = this.data.comments.map((comment) => {
        if (comment.id == id) {
          return replyingToComment
        }

        return comment
      })

      this.saveToLs(this.data)
    },

    saveToLs(data) {
      localStorage.setItem('commentsAppData', JSON.stringify(data))
      //console.log(JSON.parse(localStorage.getItem('commentsAppData')))
    },

    get getId() {
      this.data.lastId++
      return this.data.lastId
    },
  }))
})

async function getData() {
  // localStorage.clear()
  // Get data from Local storage
  const dataFromLs = JSON.parse(localStorage.getItem('commentsAppData'))

  // Or load form file
  if (!dataFromLs) {
    const res = await fetch('data.json'),
      dataFromFile = await res.json()

    return { ...dataFromFile, lastId: 4 }
  }

  return dataFromLs
}

function timeSince(dateStamp) {
  if (dateStamp.includes('ago')) {
    return dateStamp.slice(0, -4)
  }

  const date = new Date(dateStamp)

  let seconds = Math.floor((new Date() - date) / 1000),
    interval = seconds / 31536000

  if (interval > 1) {
    return Math.floor(interval) + ' years'
  }
  interval = seconds / 2592000
  if (interval > 1) {
    return Math.floor(interval) + ' months'
  }
  interval = seconds / 86400
  if (interval > 1) {
    return Math.floor(interval) + ' days'
  }
  interval = seconds / 3600
  if (interval > 1) {
    return Math.floor(interval) + ' hours'
  }
  interval = seconds / 60
  if (interval > 1) {
    return Math.floor(interval) + ' minutes'
  }
  return Math.floor(seconds) + ' seconds'
}
