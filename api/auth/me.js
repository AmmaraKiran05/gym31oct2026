import { route } from '../_lib/http.js'
import { currentUser, endSession, hasSessionCookies, publicUser } from '../_lib/auth.js'

export default route({
  async GET(req, res) {
    const user = await currentUser(req)
    if (!user) {
      if (hasSessionCookies(req)) endSession(res) // expired or deleted account: clear the stale cookies
      return res.status(401).json({ error: 'You’re not logged in.', user: null })
    }
    res.status(200).json({ user: publicUser(user) })
  },
})
