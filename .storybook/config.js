import { configure } from '@kadira/storybook'

require('../assets/css/screen.less')
require('../assets/css/chat.less')
require('../assets/css/kbd.css')

function loadStories () {
  require('../src/stories/ChatArea')
  require('../src/stories/ChatBubble')
  require('../src/stories/ConnectionList')
}

configure(loadStories, module)
