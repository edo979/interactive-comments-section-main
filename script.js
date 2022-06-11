document.addEventListener('alpine:init', () => {
  Alpine.data('commentsApp', () => ({
    data: {},

    set setData(data) {
      this.data = data
    },

    set setComments(comments) {
      this.data.comments = comments
    },

    get getId() {
      this.data.lastId++
      return this.data.lastId
    },

    saveReply({ id, replyMessage, replyingTo }) {
      // Create reply object
      const commentObj = this.data.comments
        .filter((comment) => comment.id == id)
        .pop()

      commentObj.replies.unshift({
        id: this.getId,
        content: replyMessage.replace(`@${replyingTo} `, ''),
        createdAt: new Date().toString(),
        score: 0,
        replyingTo,
        user: { ...this.data.currentUser },
      })

      this.saveData(commentObj, id)
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

    saveData(updatedComment, id) {
      this.data.comments = this.data.comments.map((comment) => {
        if (comment.id == id) {
          return updatedComment
        }

        return comment
      })

      this.saveToLs(this.data)
    },

    deleteComment(parrentId, id) {
      let comments = []
      if (parrentId) {
        // delete reply
        // find parent comment
        comments = this.data.comments.map((comment) => {
          if (comment.id == parrentId) {
            // remove from replies
            comment.replies = comment.replies.filter((reply) => reply.id != id)
          }

          return comment
        })
      } else {
        //delete comment
        comments = this.data.comments.filter((comment) => comment.id != id)
      }

      this.setComments = comments
      this.saveToLs(this.data)

      // reload page
      location.reload()
    },

    saveToLs(data) {
      localStorage.setItem('commentsAppData', JSON.stringify(data))
      //console.log(JSON.parse(localStorage.getItem('commentsAppData')))
    },

    getCommentInnerHtml(isReply = false) {
      let contentText = ''

      if (isReply) {
        contentText = `
          <p class="comment_content">
            <span x-text="'@' + replyingTo + ' '"></span>
            <span x-text="content"></span>
          </p>
        `
      } else {
        contentText = `<p x-text="content" class="comment_content"></p>`
      }

      return `
          <div class="flex comment_header">
            <picture>
              <source
                :srcset="user.image.webp"
                media="(min-width: 400px)"
              />
              <img :src="user.image.png" alt="" />
            </picture>

            <p class="comment_username">
              <span x-text="user.username"></span>
              <span       
                x-show="isEdit" 
                class="comment_current-user">
                You
              </span>
            </p>

            <span
              x-text="timeSince(createdAt) + ' ago'"
              class="comment_time-stamp"
            ></span>
          </div>
          
          ${contentText}

          <div class="flex comment_score">
            <button>+</button>
            <span x-text="score" class="comment_score"></span>
            <button>-</button>
          </div>

          <div class="comment_ctrl-btns">
            <template x-if="isEdit">
              <div class="comment_edit flex">
                <button @click="deleteComment(parrentCommentId, id)">
                  delete
                </button>
                <button>edit</button>
              </div>
            </template>

            <template x-if="!isEdit">
              <button
                @click="isReplyClick = ! isReplyClick"
                class="btn btn-secondary"
              >
                Reply
              </button>
            </template> 
          </div>

          <template x-if="isEdit">
            <button class="comment_update-btn btn btn-primary"
            >
              Update
            </button>
          </template>  
      `
    },

    isCurrentUser({ comment: { user }, data: { currentUser } }) {
      if (user.username === currentUser.username) {
        return true
      } else {
        return false
      }
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
