document.addEventListener('alpine:init', () => {
  Alpine.data('commentsApp', () => ({
    comments: [],
    currentUser: {},
    lastId: {},

    async getData() {
      // localStorage.clear()
      // Get data from Local storage
      const dataFromLs = JSON.parse(localStorage.getItem('commentsAppData'))

      // Or load form file
      if (!dataFromLs) {
        const res = await fetch('data.json'),
          dataFromFile = await res.json()

        this.setData = { ...dataFromFile, lastId: 4 }
      } else {
        this.setData = dataFromLs
      }
    },

    set setData({ comments, currentUser, lastId }) {
      this.comments = comments
      this.currentUser = currentUser
      this.lastId = lastId
    },

    set setComments(comments) {
      this.comments = comments
    },

    get getId() {
      this.lastId++
      return this.lastId
    },

    saveReply({ id, replyMessage, replyingTo }) {
      // Create reply object
      const commentObj = this.comments
        .filter((comment) => comment.id == id)
        .pop()

      commentObj.replies.unshift({
        id: this.getId,
        content: replyMessage.replace(`@${replyingTo} `, ''),
        createdAt: new Date().toString(),
        score: 0,
        replyingTo,
        user: { ...this.currentUser },
      })

      this.saveData(commentObj, id)
    },

    saveReplyToReply({ id, replyMessage, replyingTo, parrentCommentId }) {
      // get parrent comment, create reply object, get index of replying reply
      const replyingToComment = this.comments
          .filter((comment) => comment.id == parrentCommentId)
          .pop(),
        newReply = {
          id: this.getId,
          content: replyMessage.replace(`@${replyingTo} `, ''),
          createdAt: new Date().toString(),
          score: 0,
          replyingTo,
          user: { ...this.currentUser },
        },
        indexOfParrentReply = replyingToComment.replies.findIndex(
          (el) => el.id == id
        )

      // post reply after reply
      replyingToComment.replies.splice(indexOfParrentReply + 1, 0, newReply)

      this.saveData(replyingToComment, id)
    },

    saveData(updatedComment, id) {
      this.comments = this.comments.map((comment) => {
        if (comment.id == id) {
          return updatedComment
        }

        return comment
      })

      this.saveToLs()
    },

    deleteComment(parrentId, id) {
      let comments = []
      if (parrentId) {
        // delete reply
        // find parent comment
        comments = this.comments.map((comment) => {
          if (comment.id == parrentId) {
            // remove from replies
            comment.replies = comment.replies.filter((reply) => reply.id != id)
          }

          return comment
        })
      } else {
        //delete comment
        comments = this.comments.filter((comment) => comment.id != id)
      }

      this.setComments = comments
      this.saveToLs()

      // reload page force render
      location.reload()
    },

    saveToLs() {
      const data = {}
      data.comments = this.comments
      data.currentUser = this.currentUser
      data.lastId = this.lastId

      localStorage.setItem('commentsAppData', JSON.stringify(data))
    },

    updateComment({ content, id, parrentCommentId }) {
      if (parrentCommentId) {
        // update reply
        const comment = this.comments.find(
            (comment) => comment.id == parrentCommentId
          ),
          reply = comment.replies.find((reply) => reply.id == id)

        reply.content = content

        this.saveToLs()
      } else {
        // update comment
      }
    },

    getCommentInnerHtml(isReply = false) {
      let contentText = ''

      if (isReply) {
        contentText = `
          <template x-if="!isEditClick">
            <p class="comment_content">
              <span x-text="'@' + replyingTo + ' '"></span>
              <span x-text="content"></span>
            </p>
          </template>

          <template x-if="isEditClick">
            <textarea
              rows="3"
              x-model="content"
          ></textarea>
          </template>
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
                x-show="isCurrentUser" 
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
            <template x-if="isCurrentUser">
              <div class="comment_edit flex">
                <button @click="deleteComment(parrentCommentId, id)">
                  delete
                </button>
                
                <button @click="isEditClick = ! isEditClick">
                  edit
                </button>
              </div>
            </template>

            <template x-if="!isCurrentUser">
              <button
                @click="isReplyClick = ! isReplyClick"
                class="btn btn-secondary"
              >
                Reply
              </button>
            </template> 
          </div>

          <template x-if="isEditClick">
            <button @click="updateComment($data)" class="comment_update-btn btn btn-primary"
            >
              Update
            </button>
          </template>  
      `
    },

    checkCurrentUser({ comment: { user }, currentUser }) {
      if (user.username === currentUser.username) {
        return true
      } else {
        return false
      }
    },
  }))
})

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
