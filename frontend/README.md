# SplitUp — Frontend (React + Vite + Tailwind)

Drop this folder inside your backend repo as `frontend/`:

```
splitup-backend/
├── (your backend files)
└── frontend/          ← this folder
```

## Setup

1. **Requirements**: Node 18+ (20 recommended), backend running on `http://localhost:3000`.
2. Install & run:
   ```bash
   cd frontend
   npm install
   npm run dev          # → http://localhost:5173
   ```
3. Backend URL defaults to `http://localhost:3000`. To override, create `.env`:
   ```
   VITE_API_URL=http://localhost:3000
   ```
4. Production:
   ```bash
   npm run build        # outputs dist/
   npx serve -s dist    # any static server WITH SPA fallback (-s)
   ```
5. **Backend must**:
   - enable CORS with credentials (`origin` = your frontend origin, NOT `*`; `credentials: true`),
   - set `accesstoken` / `refreshtoken` cookies (sameSite lax for localhost),
   - for Google login, honor the `redirect_uri` query we send to `/googleauth`
     (we pass `<frontend-origin>/google-callback`), returning the user there with the tokens.

## Frontend routes (react-router)

| Route | Page |
|---|---|
| `/` | Landing (session-aware: accesstoken → /home, refreshtoken → /login) |
| `/login` · `/register` | Auth (OTP step inside register) |
| `/google-callback` | Google OAuth return (new users → profile details form) |
| `/home` | Dashboard: my requests, my applies, notifications |
| `/search` | Explore: search + filters + platform feed |
| `/platform/:platformid` | Platform details (+ image upload if missing) |
| `/create` | Create split (platform → category → plan → AI proof check) |
| `/discuss` | Temp groups list |
| `/chat/:groupid` | Temp group chat |
| `/groups` | My final groups (admin) |
| `/groupchat/:groupid` | Final group chat |
| `/profile/:userid` | Public profile + reviews + rating + report |
| `*` | Landing |

## API map — which API is called where

### Auth & session
| API | Where |
|---|---|
| `POST /register` (multipart: profilename,email,password,fullname?,phoneno?,avatar?) | Register form |
| `POST /verifyuser` `{email,otp}` | OTP step (300s expiry) |
| `POST /login` `{email,password}` | Login + post-OTP auto-login |
| `GET /revalidateuser` | Automatic on ANY 403 → retry once; fail → `/login` |
| `GET /googleauth?redirect_uri=…` | "Continue with Google" buttons |
| `POST /adduserdetails` `{profilename,phoneno?}` | Google callback (new user) |
| `GET /avilibleprofilename/:name` | Debounced availability (register + google callback) |
| `GET /getuseravatar` | Cached once; avatar chip / own-profile detection everywhere |
| `POST /logoutuser` | Logout button (own profile) |

### Home
| API | Where |
|---|---|
| `GET /getnotificationcount` / `GET /getnotification` | Bell badge + popup |
| `GET /myrequest` | "Your split requests" cards |
| `POST /deleterequest` `{requestid}` | Delete button on those cards |
| `GET /showapplicants/:requestid?page` | Applicants modal |
| `POST /acceptapplicant` / `POST /removeapplicant` `{requestid,aplicantid}` | Approve / reject in modal |
| `GET /myapply` | "Where you've applied" cards |
| `GET /showrequeststatus/:requestid` | accepted/pending pill on those cards |

### Explore / platform
| API | Where |
|---|---|
| `GET /showrequest` (searchtext, categoryid, min/maxprice, min/maxmember, planvalidityday, slots, page, limit) | Feed + search (default feed: minmember=0&maxmember=12) |
| `GET /showallcategory?cursor` | Category filter popup |
| `POST /applyforrequest` `{requestid}` | Apply button (others' requests) |
| `GET /detailsofplatform/:platformid` | Platform page (click platform name on a request) |
| `GET /showplatformimage/:platformid` | Platform image fallback chain |
| `POST /addplatformimage` (multipart: platformimage + platformid) | Upload when platform has no image |

### Create split
| API | Where |
|---|---|
| `GET /showallplatform?cursor` | Step 1 platforms |
| `POST /createplatform` `{platformname,platformdescription}` | "Add new platform" |
| `POST /selectcategory` `{categoryid,platformid}` | Attach existing category |
| `POST /createcategory` `{categoryname,platformid}` | Create new category |
| `POST /selectplatform` `{platformid}` | Pick platform → `newrequest._id` |
| `POST /platformsplit` (multipart: requestid, planname, planprice, planvalidityday, totalslots, proofimages[1–2]) | Step 2 (AI check — warp loader) |

### Discuss (temp groups)
| API | Where |
|---|---|
| `GET /showallgroup` | Discuss list |
| `GET /numberofunsceenmsgintempgroup/:groupid` | Unseen badge per group |
| `GET /getunsceentempgroupmessaeg/:groupid` | Unseen messages in chat |
| `GET /showoldmessageoftempgroup/:groupid?cursor` | Older messages ("Load older") |
| socket `join-room {requestId}` · `send-message {message}` · `receive-message` · `message-error` | Live chat |
| `POST /sendpaymentproof` (multipart: proofimage + requestid) | Member "Upload payment proof" |
| `GET /showallproofimage/:requestid` | Requester proofs panel |
| `POST /aproveusers` / `POST /rejectusers` `{paymentproofid}` | Approve/reject proofs (closing the group-picker without adding reverts via rejectusers) |
| `GET /showalladmingroups` · `POST /addnewgroup` `{groupname}` · `POST /addmembers` `{groupid,candidate,requestid}` | Approve → choose/create group → add member |

### Final groups
| API | Where |
|---|---|
| `GET /showalladmingroups?cursor` | My Groups list |
| `GET /numberofunsceenmsginfinalgroup/:groupid` | Unseen badge |
| `GET /getunsceenfinalgroupmessaeg/:groupid` · `GET /showoldmessage/:groupid?cursor` | Chat messages |
| socket `join-finalchat {groupid}` · `send-final-message {message}` · `receive-message` · `message-error` | Live chat |
| `GET /showplansofafinalgroup/:groupid` | "Show details" modal |
| `POST /selectplatformtofinalgroup` `{platformid}` · `POST /addplan` `{groupid,planname,planvalidity}` | "Add plan" (admin) |
| `POST /addsignindetails` `{planid,platformemail,platformepassword}` | Admin adds credentials per plan |
| `GET /showlogindetails/:planid` | On-click credentials view + copy buttons |
| `GET /showdeleterequest/:groupid` (once on enter) | Delete-request alert |
| `POST /deletegrouprequest` `{groupid}` | Admin raises delete request |
| `POST /acceptdeleterequest` / `POST /rejectdeleterequest` `{groupid}` | Members accept/reject |

### Profile
| API | Where |
|---|---|
| `GET /showprofile/:userid` | Profile card |
| `GET /showreviews/:userid` | Reviews + show more |
| `GET /showalredyratedornot/:rateduserid` | Prefill edit vs new rating |
| `POST /rateuser` / `POST /editrating` `{rateduserid,rating,review?}` | Star picker |
| `POST /reportuser` `{reporteduserid,reason}` | Report (others only) |

### Global
| API | Where |
|---|---|
| `POST /reportabug` `{description}` | Floating 🐞 button (bottom-right, all pages) |

## Notes
- Socket.IO connects to the same `VITE_API_URL` with `withCredentials` (your `accesstoken` cookie authenticates the handshake).
- Text limiters match your schemas (profilename/fullname 10, phone 10 digits, review 100, etc.).
- `scripts/smoke.mjs` (`npx vite-node scripts/smoke.mjs`) render-tests all routes after changes.
