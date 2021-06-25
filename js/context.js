
/** Although this class does not use jQuery directly it references User, Story, and StoryList which do.
 * Context is used for maintaining application state as well as for reading and writing local storage based on user
 * rather than globally. This allows us to keep hidden stories between sessions. We will need to be able to resolve
 * these hidden stories because of the chances of deletion on server, however we COULD also "vault" them here...
 */
 class Context {
    static _user = null;            //The currently logged in user (same as the old global Context.user)
    static _mode = "";              //Default mode is all-stories mode, with or without user
    static _lsRootKeys = null;      //The root level keys in local storage. We can look for username here.
    static _modes = ["", "favorites", "hidden", "mine"];
    static _lsRoot = null;          //ALL local storage data
    static _storyList = null;       //A globally available list of stories
//    static _targetList = null;
    constructor(user = null) {
      if(user)Context.user = user;
    }
    
    static get user() {return this._user}
    static set user(user) {
        Context._user = user;
        if(Context._user) {
            if(!Context._lsRoot[user.username]) {
                //This will make an empty user profile in local storage for first-time (sign-up)
                if(user.username)Context.writeLocalStorage(user.username, {hiddenStories : [], lastMode : Context.mode});
            }
        }
    }
  
    static get mode() {return Context._mode;}
    static set mode(newMode) {
        newMode = newMode.toLowerCase();
        Context._mode = Context._modes.indexOf(newMode) >= 0 ? newMode : "";
    }
  
    static get storyList() {return Context._storyList}
    static set storyList(storyList) {Context._storyList = storyList}

  /**
   * Read the local storage into Context._lsRoot and return it or just return some root level item
   * @param item  {String}  If null then return ALL items otherwise get the specified item    
   * @returns {any}  Returns the JSON.parse result of the data-read. 
   */  
    static readLocalStorage(item = null) {
        if(!item)return Context._lsRoot;
        if(Context.rootKeys.indexOf(item) == -1)return null;
        item = Context._lsRoot[`${item}`];
        return item;
     }
     
/**
 * 
 * @param {String} item                                 A string (key) to write to
 * @param {Object | Array} data     The data to write to the key
 * @returns 
 */
    static writeLocalStorage(item = null, data = null) {
        if(!item)item = Context._lsRoot;    //We'll just write all that we have by default unless there is more to be added via object
        localStorage.setItem(item, JSON.stringify(data));
        Context.readLocalStorage(); //Go ahead and update our copy of localStorage while we're here
    }

    static removeLocalStorage(what = null) {
        if(!what){
            localStorage.clear();
            return;
        }
        if(Array.isArray(what)) {
            for(item of what) {
                localStorage.removeItem(item);
            }
        }
        else localStorage.removeItem(what);
    }

  /**   Read all local storage by first reading all of the root-level keys and loading them
   *    into the Context class' static members. We support having the last signed-in user info
   *    being stored at root-level and each user who has signed in has some info stashed such as
   *    hidden items which are not managed by the server. Extend the functionality of the app.
   *    Return the root-level items as an Object.
   * @returns {Array} Returns the array of root-level item keys in localStorage
   */
    static get rootKeys() {
        Context._lsRootKeys = [];
        let key = "";
        Context._lsRoot = {};
        for(let index = 0; index < localStorage.length; index++) {
            Context._lsRootKeys.push(key = localStorage.key(index));
            let item = localStorage.getItem(key);
            Context._lsRoot[key] = JSON.parse(item);
        }
        return Context._lsRootKeys;
        }
  }
  