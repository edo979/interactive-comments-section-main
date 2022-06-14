document.addEventListener('alpine:init', () => {
  Alpine.data('commentsApp', () => ({
    comments: [],
    currentUser: {},
    lastId: {},
    isModalShow: false,
    deleteCommentData: {},

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
      this.comments = [...comments]
    },

    get getId() {
      this.lastId++
      return this.lastId
    },

    saveNewComment({ commentContent, currentUser }) {
      if (commentContent) {
        const comment = {
          id: this.getId,
          content: commentContent,
          createdAt: new Date().toString(),
          score: 0,
          user: { ...currentUser },
          replies: [],
        }

        this.comments = this.comments.concat(comment)
        this.saveToLs()
      }
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

      this.saveCommentsData(commentObj, id)
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

      this.saveCommentsData(replyingToComment, id)
    },

    saveCommentsData(updatedComment, id) {
      this.comments = this.comments.map((comment) => {
        if (comment.id == id) {
          return updatedComment
        }

        return comment
      })

      this.saveToLs()
    },

    deleteComment() {
      const parrentId = this.deleteCommentData.parrentCommentId,
        id = this.deleteCommentData.id

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
      } else {
        // update comment
        this.comments.find((comment) => comment.id == id).content = content
      }

      this.saveToLs()
    },

    changeScore(value, { id, parrentCommentId }) {
      // mutate comment value
      function setScore(value, comment) {
        if (value == '+') {
          comment.score = comment.score + 1
        } else {
          comment.score = comment.score - 1
        }
      }

      if (parrentCommentId) {
        // change score for reply
        const comment = this.comments.find(
            (comment) => comment.id == parrentCommentId
          ),
          reply = comment.replies.find((reply) => reply.id == id)

        setScore(value, reply)

        this.saveCurrentUserScoredComments(id)
        this.saveCommentsData(comment, parrentCommentId)
      } else {
        // change score for commment
        const comment = this.comments.find((comment) => comment.id == id)

        setScore(value, comment)

        this.saveCurrentUserScoredComments(id)
        this.saveCommentsData(comment, id)
      }

      location.reload()
    },

    saveCurrentUserScoredComments(id) {
      // if user not scored comments before
      // create array for scored comments
      if (!this.isScoringDataSet()) {
        this.currentUser.scoredComments = []
      }

      this.currentUser.scoredComments.push(id)

      console.log(this.currentUser)
    },

    isScoringDataSet() {
      if (this.currentUser.scoredComments) {
        return true
      } else {
        return false
      }
    },

    isScoredComment(id) {
      if (this.isScoringDataSet()) {
        return this.currentUser.scoredComments.includes(id)
      } else {
        return false
      }
    },

    getCommentInnerHtml(isReply = false) {
      let contentText = ''

      if (isReply) {
        contentText = `
          <template x-if="!isEditClick">
            <p class="comment_content">
              <span x-text="'@' + replyingTo + ' '" class="comment_content-replying-to"></span>
              <span x-text="content"></span>
            </p>
          </template>

          <template x-if="isEditClick">
            <textarea
              rows="3"
              x-model="content"
              class="comment_reply-edit comment-input"
          ></textarea>
          </template>
        `
      } else {
        contentText = `
          <template x-if="!isEditClick">
            <p x-text="content" class="comment_content"></p>
          </template>

          <template x-if="isEditClick">
            <textarea
              rows="3"
              x-model="content"
              class="comment_reply-edit comment-input"
            ></textarea>
          </template>
        `
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
                class="badge">
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
            <button @click="changeScore('+', $data)"
            :disabled="isScoredComment(id) || checkCurrentUser($data)">+</button>

            <span x-text="score" class="comment_score-value"></span>

            <button @click="changeScore('-', $data)" :disabled="isScoredComment(id) || checkCurrentUser($data)">-</button>
          </div>

          <div class="comment_ctrl-btns">
            <template x-if="isCurrentUser">
              <div class="comment_edit flex">
                <button @click="() => {
                  deleteCommentData = {parrentCommentId, id};
                  isModalShow = true}" class="comment_edit-delete flex">
                  <svg width="12" height="14" xmlns="http://www.w3.org/2000/svg"><path d="M1.167 12.448c0 .854.7 1.552 1.555 1.552h6.222c.856 0 1.556-.698 1.556-1.552V3.5H1.167v8.948Zm10.5-11.281H8.75L7.773 0h-3.88l-.976 1.167H0v1.166h11.667V1.167Z" fill="#ED6368"/></svg>
                  delete
                </button>
                
                <button @click="isEditClick = ! isEditClick" class="comment_edit-edit flex">
                <svg width="14" height="14" xmlns="http://www.w3.org/2000/svg"><path d="M13.479 2.872 11.08.474a1.75 1.75 0 0 0-2.327-.06L.879 8.287a1.75 1.75 0 0 0-.5 1.06l-.375 3.648a.875.875 0 0 0 .875.954h.078l3.65-.333c.399-.04.773-.216 1.058-.499l7.875-7.875a1.68 1.68 0 0 0-.061-2.371Zm-2.975 2.923L8.159 3.449 9.865 1.7l2.389 2.39-1.75 1.706Z" fill="#5357B6"/></svg>  
                edit
                </button>
              </div>
            </template>

            <template x-if="!isCurrentUser">
              <button
                @click="isReplyClick = ! isReplyClick"
                class="btn btn-secondary flex"
                style="--gap: 0.5rem;"
              >
                <img src="images/icon-reply.svg" /> Reply
              </button>
            </template> 
          </div>

          <template x-if="isEditClick">
            <button @click="() => {
              updateComment($data);
              isEditClick = false;
              }" class="comment_update-btn btn btn-primary"
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
