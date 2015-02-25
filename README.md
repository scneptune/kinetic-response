
## FLUX/React  Kinetic-Response
by @SCNEPTUNE (inspired by the flux-react framework by @christianalfoni)
A first pass at stand alone commenting using a flux/react framework.

Based on the architecture suggestions from Facebook, this boilerplate will help you deal with it. It has included the flux-react extension to React JS, [flux-react](https://github.com/christianalfoni/flux-react). 

========

##Release Notes:

v.0.0.1 
    - Refactored original React powered system to use more principles of flux with a single source of data truth.
    - Added a slew of actions to the datastore to get basic commenting and replying working
    - Next version will have working rating and sorting working. 
    - Styling is currently pulled in from a local copy of the css I have of xavier DX. (styling could be isolated).
    - TODO:Voting comments, attaching ratings to comments, sorting.  


### Development
* Run `gulp`
* Start a webservice in the `build` folder, f.ex. `python -m SimpleHTTPServer`
* Go to `localhost:8000` to display the app
* Go to `localhost:8000/testrunner.html` to see your tests
* Any changes to `app` or `styles` folder will automatically rebuild to `build` folder
* Both tests and application changes will refresh automatically in the browser
* Run `gulp test` to run all tests with phantomJS and produce XML reports

### Minify the code, ready for production
* Run `gulp deploy`

### Directory
* **build/**: Where your automatically builds to. This is where you launch your app in development
* **dist/**: Where the deployed code exists, ready for production
* **styles/**: Where you put your css files
* **specs/**: Where you put your test files
* **gulpfile**: Gulp configuration


