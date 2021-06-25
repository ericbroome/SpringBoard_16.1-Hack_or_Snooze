/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

 class StoryList {
    constructor(stories) {
        this.stories = stories;
        Context.storyList = this;
        if(!Context.user)return;
     }
  
    /** Generate a new StoryList. It:
     *
     *  - calls the API
     *  - builds an array of Story instances
     *  - makes a single StoryList instance out of that
     *  - returns the StoryList instance.
     */
  
    static async getStories() {
        let response = null;
        try{
            response = await axios({
                url: `${BASE_URL}/stories`,
                method: "GET",
            });
        }catch(error) {
            console.debug(error.response.data.error);
            return null;
        }
        // turn plain old story objects from API into instances of Story class
        let stories = response.data.stories.map(story => {
            let result = new Story(story);
            return result;
        });
        //Now, if a user is logged in , we will look up favorites, own, and hidden
        // build an instance of our own class using the new array of stories
        if(Context.user) {
          
        }
        const storyList = new StoryList(stories);
        return Context.storyList = storyList;
    }

  /******************************************************************************/
    /**
     * Returns from the local list of stories an array of stories matching the id. We get the array so that we can clean up
     * @param {String} id The story id to be returned
     * @returns {Array} Rather than a single story we return an Array due to remote possibility of duplicates
     */
     static getStoryById(id) { return $.grep(Context.storyList.stories, item=>item.storyId == id); }
  
  /******************************************************************************/
    /**
     * Returns from the local list of stories an array of stories matching the username. We get the array so that we can clean up
     * @param {String} username The story id to be returned
     * @returns {Array} Return all of the stories owned by a particular user.
     */
     static getStoriesByUsername(username) { return $.grep(Context.storyList.stories, item => item.username == username); }
  
  /******************************************************************************/
    /**
     * @returns {Array} Returns an array of hidden stories.
     */
    static getHiddenStories() {
        let hiddenStories = $.grep(Context.storyList.stories, story => story.isHidden);
        return hiddenStories;
    }
  
  /******************************************************************************/
  /** Adds story data to API, makes a Story instance.
   * We have to add it to ownStories directly because when this call returns the
   * caller will requery for all stories but the only way to get ownStories is
   * to login again SO we add it here.
   * 
   * @param {Object} newStory {title, author, url}
   * @returns 
   */

    static async addStory(newStory) {
      let response = null;
      try {
        response = await axios({
            url: `${BASE_URL}/stories`,
            method: "POST",
            data: {token: Context.user.loginToken, story: newStory}
        });
        }catch(error) {
            console.debug(error.response.data.error);
            return null;
        }
      let story = new Story(response.data.story);
      story.isMine = true;
      Context.user.ownStories.push({title: story.title, author: story.author, url: story.url, username: story.username, storyId: story.storyId, createdAt: story.createdAt});
      Context.storyList.stories.unshift(story);
      return story;
    }

  }
  
  
  
