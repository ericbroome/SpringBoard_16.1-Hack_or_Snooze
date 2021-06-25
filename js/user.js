"use strict";

/******************************************************************************/
/* User: a user in the system (only used to represent the current user) */
  
class User extends Context {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */
  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                stories = []
              },
              token) {
    super();
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;
    this.favorites = favorites;
    this.ownStories = stories;  
    this.loginToken = token;
    Context.user = this; //We do this to make it accessible in the context as "user"
}


/*****************************************************************************/
/**
 * Create a new user
 * @param {string} username The new user's username used for login
 * @param {string} password The new user's password used for login
 * @param {string} name     The new user's name used for display purposes
 * @returns {undefined}     No return value expected
 */
  
  static async signup(username, password, name) {
    let newUser = null;
    try{
      const response = await axios({
        url: `${BASE_URL}/signup`,
        method: "POST",
        data: { user: { username, password, name } },
      });
      let { user } = response.data
      newUser = new User({ ...user}, response.data.token);
    }catch(error) {
      console.debug(error.response.data.error);
      return null;
    }
    Context.user = newUser; //This will result in automatic creation of user profile in local storage
    return newUser;
  }

/**
 * Log in an existing user and return a new User instance.
 * @param {String} username an existing user's username
 * @param {String} password an existing user's password
 * @returns 
 */
  static async login(username, password) {
    let response = null; 
    try {
      response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    })}catch(error) {
      console.debug(error.response.data.error);
      return null;
    }
    let { user } = response.data;
    let newUser = new User({ ...user}, response.data.token);
    Context.user = newUser;
    return newUser;
  }

  /** Modify user in API, make User instance & return it.
   *
   * @param {String} password: a new password
   * @param {String} name: the user's full name
   */
   static async editUser(password, name = null) {
    const data = {};
    let response = null;
    //We must change something and that something must not be all spaces.
    if(!Context.user || 
      (!name && !password) || 
      (name == '' && password == '') || 
      (name.trim().length == 0 && password.trim().length == 0)) return null;
    if(name) data['name'] = name;
    if(password) data['password'] = password;
    let request = {
      method: "PATCH",
      url: `${BASE_URL}/users/${Context.user.username}`,
      data: {
        token: Context.user.loginToken,
        user: {...data}
      }
    };
    console.debug(request);
    try {
      response = await axios(request);
      console.debug(`Requested to modify user`);
    }catch(error) {
      console.debug(error.response.data.error);
      return null;
    }
     Context.user.name = response.data.user.name;
     $changeForm.hide();
     $changeForm.trigger("reset");
    return Context.user;
  }
/**
 * We are only interested in getting the hidden stories from local storage. They are not instances of Story.
 * The hiddenStories found in localStorage must be converted into actual stories and to do THAT we need to already
 * have some stories loaded. Do not invoke this method until at least some stories have been loaded from server.
 * Hidden stories which do not have a matching story from the server can be resolved by querying the server to see
 * if the story still exists but in this case we just create a new Story instance and as long as the story remains
 * hidden it is effectively "time machined" aka "vaulted".
 * @returns 
 */
  readLocalStorage() {
    let ls = Context.readLocalStorage(this.username);
    this.hiddenStories = [];
    if(!ls.hiddenStories) {this.writeLocalStorage(); return null;}
    let unMatched = ls.hiddenStories.filter(hStory => { //We do this for vaulting stories in case they get deleted.
      let matched = Context.storyList.stories.filter(story => {
        if(story.storyId == hStory.storyId) {
            story.isHidden = true;
            this.hiddenStories.push(story);
          return true;
        }
        return false;
      });
      if(matched.length == 0)
      {
        let newStory = new Story({...hStory});
        newStory.isHidden = true;
        Context.storyList.stories.push(newStory);
        this.hiddenStories.push(newStory);
        return true;
      }
      return false;
    });
    console.debug(`${unMatched.length} unmatched hidden stories had to be added`);
    return ls;
  }

  writeLocalStorage() {
    let hs = this.hiddenStories.map(s => { return {isHidden: true, storyId: s.storyId, title: s.title, username: s.username, url: s.url, createdAt: s.createdAt, author: s.author}});
   let ls = {hiddenStories: hs};
    Context.writeLocalStorage(this.username, ls);
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */
  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });
      let { user } = response.data;
      return new User({ ...user}, token);
    } catch (error) {
        console.debug(error.response.data.error);
        return null;
    }
  }


/*****************************************************************************/
  /** 
   *  Add or remove a favorite.
   *  Clearly the server uses the same url to add and delete favorites.
   *  Because user favorites are not the same object as stories in the list we can't just 
   *  search for the story Object in the favorites but must search by storyId.
   *  Only favorites added in this session will match object with the list.
   */

  static async favorite(story) {
    if(Context.user ==null)return null;
    let response = null;
    let action = story.favorite ? "DELETE" : "POST";
    try {
      response = await axios({
        url: `${BASE_URL}/users/${Context.user.username}/favorites/${story.storyId}`,
        method: action,
        data: { token: Context.user.loginToken },
      });
    }catch(error) {
      console.debug(`Failed to perform favorite(story) on ${item.storyId}`)
      console.debug(error.response.data.error);
      return null;
    }
    story.favorite = (action == "POST" ? true : false);
    //Upon return there should be an updated list of favorites as part of the response.
    Context.user.favorites = [...response.data.user.favorites];
    updateFavorites();
    return story;
  }


/*****************************************************************************/
  /**
   * Hide or Delete a story. 
   * If we do not own the story, just hide it and add it to hidden stories in local storage. 
   * If the story is already hidden, unhide it. If we do own the story AND we're showing only
   * our own stories (context is "mine") then permanently delete the story.
   * To stash a story we hide it so that if it is deleted from the server we still have a copy as long as it
   * remains in local storage as "hidden". We call this a "feature" ;)
   * @param {Story} story 
   * @param {Boolean} stash Do we update the local storage? No need to do this when reading from local storage.
   * @returns 
   */

  static async deleteStory(story, stash=true) {
    if(Context.user == null)return;
    let response = null;
    let isMine = (story.username == Context.user.username);
    //We can only actually DELETE a story from the "mine" context
    if(isMine && Context.mode == "mine" && story.isHidden == true) {
      try {
          //--------AWAIT--------
          response = await axios({
          url: `${BASE_URL}/stories/${story.storyId}`,
          method: "DELETE",
          data: { 
            token: Context.user.loginToken,
            storyId: story.storyId},
        });
      }catch(error) {
        console.debug(error.response.data.error);
        return;
      }
      Context.storyList.stories.splice(Context.storyList.stories.findIndex(item => item.storyId == story.storyId), 1);
      Context.user.hiddenStories.splice(Context.user.hiddenStories.findIndex(item => item.storyId == story.storyId), 1);
      Context.user.ownStories.splice(Context.user.ownStories.findIndex(item => item.storyId == story.storyId), 1);
      story.element.remove();
      Context.user.writeLocalStorage();
      return;
    }
    story.isHidden = story.isHidden == true ? false : true;
    story.hide(story.isHidden, stash);
  }



/*****************************************************************************/
  /**
   * Edit a story. The story must have been created by the current user. 
   * @param {Story} story         The story object to be edited.
   * @param {Object} editObject   can contain one or more of {author, title, url}.
   */

  static async editStory(story, editObject) {
    if(Context.user == null)return;
    try {
      const response = await axios({
        url: `${BASE_URL}/stories/${story.storyId}`,
        method: "PATCH",
        data: { 
          token: Context.user.loginToken,
          story: editObject
        }
      });
    }catch(error) {
      console.debug(error.response.data.error);
    }
  }


/*****************************************************************************/
  /**
   * Switch to another mode. There are 4 primary modes:
   *  all ("") - We show all stories except hidden ones. This is the only available primary mode when not logged in.
   *  "favorites" - We only show favorites including hidden ones.
   *  "hidden" - We show all hidden stories. Clicking on the green X will un-hide them but not delete them.
   *  "mine" - We show only the stories of the logged-in user. A grey X can hide it. A red x deletes it permanently.
   */

  static set mode(newMode) {
    if(!Context.user)return;
    Context.mode = newMode;
    let $target = getActiveContextView(); //The view isn't "active" per se but it will be
    hidePageComponents();
    if(Context.mode == "mine") {
      Context.user.ownStories.forEach(story => {
        $target.append(story.element);
      })
    }
    if(Context.mode == "favorites")  {
      Context.user.favorites.forEach(story => {
        $target.append(story.element);
      })
    }
    if(Context.mode == ""){
      Context.user.favorites.forEach(story => {$target.append(story.element);});
      Context.user.ownStories.forEach(story => {$target.append(story.element);});
    }
    $target.show();
  }
}
 

