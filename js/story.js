/*---------------------------------------------------------------------------*/
/******************************************************************************
 * Story: a single story in the system
 */

 class Story {
    /** Make instance of Story from data object about story:
     *   - {title, author, url, username, storyId, createdAt}
     */
  
    constructor({ storyId, title, author, url, username, createdAt}) {
        this.storyId = storyId;
        this.title = title;
        this.author = author;
        this.url = url;
        this.username = username;
        this.createdAt = createdAt;
        this.element = null;          //The html element (li)
        this.isFavorite = false;
        this.isHidden = false;
        this.isMine = false;
    }

/*---------------------------------------------------------------------------*/
/**
 *  Parses hostname out of URL and returns it.
 */
    getHostName() {
        return new URL(this.url).host;
    }

/*---------------------------------------------------------------------------*/
/**
 * 
 * @param {*} bHide 
 */
    hide(bHide = true, stash = true) {
      this.isHidden = bHide;
      if(this.isHidden == true) {
        $hiddenStoriesList.append(this.element);
        Context.user.hiddenStories.push({title: this.title, author: this.author, url: this.url, username: this.username, storyId: this.storyId, createdAt: this.createdAt});
      }
      else {
        Context.user.hiddenStories.splice(Context.user.hiddenStories.findIndex(item => item.storyId == this.storyId), 1);
        $allStoriesList.append(this.element);
      }
      if(stash==true) {
        Context.user.writeLocalStorage();
      }
    }

  
  }
  