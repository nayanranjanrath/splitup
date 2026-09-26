/**
 * SplitUp API client
 * Backend: http://localhost:3000
 *
 * Auth:
 * - access token -> accesstoken cookie
 * - refresh token -> refreshtoken cookie
 * - credentials:"include" on every request
 *
 * Refresh happens ONLY when:
 * - 403 + ACCESS_TOKEN_EXPIRED
 * - 401 + NO_ACCESS_TOKEN
 * - 401 + INVALID_ACCESS_TOKEN
 */

const RAW = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const API_URL = RAW.replace(/\/+$/, "");

export const apiConfigured = () => API_URL.length > 0;

/* =========================================================
   COOKIES
========================================================= */

export function getCookie(name) {
  const hit = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));

  return hit
    ? decodeURIComponent(hit.split("=").slice(1).join("="))
    : null;
}

export const hasAccessToken = () => Boolean(getCookie("accesstoken"));

export const hasRefreshToken = () => Boolean(getCookie("refreshtoken"));

export function clearTokens() {
  document.cookie = "accesstoken=; path=/; max-age=0";
  document.cookie = "refreshtoken=; path=/; max-age=0";
}

/* =========================================================
   SESSION RENEWAL
========================================================= */

export async function revalidateUser() {
  for (const method of ["POST", "GET"]) {
    try {
      const res = await fetch(API_URL + "/revalidateuser", {
        method,
        credentials: "include",
      });

      if (res.ok) {
        return true;
      }

      if (res.status === 404 || res.status === 405) {
        continue;
      }

      return false;
    } catch {
      return false;
    }
  }

  return false;
}

/* =========================================================
   CORE FETCH FUNCTION
========================================================= */

export async function apiFetch(
  path,
  {
    method = "GET",
    body,
    auth = true,
    form = false,
    quiet = false,
    _retried = false,
  } = {}
) {
  const headers = form
    ? {}
    : {
        "Content-Type": "application/json",
      };

  let res;

  try {
    res = await fetch(API_URL + path, {
      method,
      headers,
      body: form
        ? body
        : body
        ? JSON.stringify(body)
        : undefined,
      credentials: "include",
    });
  } catch {
    throw new Error("Internal server error");
  }

  /* -----------------------------------------
     Parse backend response
  ----------------------------------------- */

  let data = null;

  try {
    data = await res.json();
  } catch {
    // Non JSON response
  }

  const code = data?.code;

  /* -----------------------------------------
     Refresh ONLY authentication failures
  ----------------------------------------- */

  const shouldRefresh =
    auth &&
    !_retried &&
    (
      (res.status === 403 &&
        code === "ACCESS_TOKEN_EXPIRED") ||
      (res.status === 401 &&
        (
          code === "NO_ACCESS_TOKEN" ||
          code === "INVALID_ACCESS_TOKEN"
        ))
    );

  if (shouldRefresh) {
    const renewed = await revalidateUser();

    if (renewed) {
      return apiFetch(path, {
        method,
        body,
        auth,
        form,
        quiet,
        _retried: true,
      });
    }

    if (!quiet) {
      window.location.assign("/login");
    }

    throw new Error(
      data?.message ||
        "Session expired — please sign in again."
    );
  }

  /* -----------------------------------------
     Normal backend errors
  ----------------------------------------- */

  if (!res.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        data?.detail ||
        `Request failed (${res.status})`
    );
  }

  return data;
}

/* =========================================================
   AUTH
========================================================= */

export const login = (email, password) =>
  apiFetch("/login", {
    method: "POST",
    body: {
      email,
      password,
    },
    auth: false,
  });

export const registerUser = ({
  profilename,
  email,
  password,
  fullname,
  phoneno,
  avatar,
}) => {
  const fd = new FormData();

  fd.append("profilename", profilename);
  fd.append("email", email);
  fd.append("password", password);

  if (fullname) {
    fd.append("fullname", fullname);
  }

  if (phoneno) {
    fd.append("phoneno", phoneno);
  }

  if (avatar) {
    fd.append("avatar", avatar);
  }

  return apiFetch("/register", {
    method: "POST",
    body: fd,
    auth: false,
    form: true,
  });
};

export const verifyUser = (email, otp) =>
  apiFetch("/verifyuser", {
    method: "POST",
    body: {
      email,
      otp,
    },
    auth: false,
  });

export const addUserDetails = ({
  profilename,
  phoneno,
}) =>
  apiFetch("/adduserdetails", {
    method: "POST",
    body: {
      profilename,
      phoneno,
    },
  });

export async function availableProfilename(name) {
  try {
    const data = await apiFetch(
      "/avilibleprofilename/" +
        encodeURIComponent(name),
      {
        auth: false,
      }
    );

    const msg = data?.message || "";

    return {
      available: /available/i.test(msg),
      message: msg,
    };
  } catch (err) {
    return {
      available: false,
      message:
        err?.message ||
        "Profile name is already taken",
    };
  }
}

export function googleSignIn() {
  const back = encodeURIComponent(
    window.location.origin + "/google-callback"
  );

  window.location.href =
    `${API_URL}/googleauth?redirect_uri=${back}`;
}

/* =========================================================
   USER / NOTIFICATIONS
========================================================= */

export const getUserProfile = (quiet = false) =>
  apiFetch("/getuseravatar", {
    quiet,
  });

export const getNotificationCount = () =>
  apiFetch("/getnotificationcount");

export const getNotifications = () =>
  apiFetch("/getnotification");

export const getMyRequests = () =>
  apiFetch("/myrequest");

export const getMyApplies = () =>
  apiFetch("/myapply");

/* =========================================================
   REQUEST SEARCH / CATEGORY
========================================================= */

export function searchRequests(params) {
  const q = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v != null) {
      q.set(k, v);
    }
  });

  return apiFetch("/showrequest?" + q.toString());
}

export function getCategories(cursor) {
  return apiFetch(
    "/showallcategory" +
      (cursor
        ? `?cursor=${encodeURIComponent(cursor)}`
        : "")
  );
}

/* =========================================================
   CREATE SPLIT FLOW
========================================================= */

export function getPlatforms(cursor) {
  return apiFetch(
    "/showallplatform" +
      (cursor
        ? `?cursor=${encodeURIComponent(cursor)}`
        : "")
  );
}

export const selectPlatform = (platformid) =>
  apiFetch("/selectplatform", {
    method: "POST",
    body: {
      platformid,
    },
  });

export const submitPlatformSplit = (fd) =>
  apiFetch("/platformsplit", {
    method: "POST",
    body: fd,
    form: true,
  });

/* =========================================================
   ADD PLATFORM / CATEGORY
========================================================= */

export const createPlatform = (
  platformname,
  platformdescription
) =>
  apiFetch("/createplatform", {
    method: "POST",
    body: {
      platformname,
      platformdescription,
    },
  });

export const selectCategory = (
  categoryid,
  platformid
) =>
  apiFetch("/selectcategory", {
    method: "POST",
    body: {
      categoryid,
      platformid,
    },
  });

export const createCategory = (
  categoryname,
  platformid
) =>
  apiFetch("/createcategory", {
    method: "POST",
    body: {
      categoryname,
      platformid,
    },
  });

/* =========================================================
   APPLICANTS
========================================================= */

export function showApplicants(
  requestid,
  page = 1
) {
  return apiFetch(
    `/showapplicants/${requestid}?page=${page}`
  );
}

export const acceptApplicant = (
  requestid,
  aplicantid
) =>
  apiFetch("/acceptapplicant", {
    method: "POST",
    body: {
      requestid,
      aplicantid,
    },
  });

export const removeApplicant = (
  requestid,
  aplicantid
) =>
  apiFetch("/removeapplicant", {
    method: "POST",
    body: {
      requestid,
      aplicantid,
    },
  });

export const showRequestStatus = (requestid) =>
  apiFetch(
    `/showrequeststatus/${requestid}`
  );

export const logoutUser = () =>
  apiFetch("/logoutuser", {
    method: "POST",
  });

/* =========================================================
   APPLY / PLATFORM DETAILS
========================================================= */

export const applyForRequest = (requestid) =>
  apiFetch("/applyforrequest", {
    method: "POST",
    body: {
      requestid,
    },
  });

export const alredyAppliedOrNot = (requestid) =>
  apiFetch(
    `/alredyappliedornot/${requestid}`,
    {
      quiet: true,
    }
  );

export const detailsOfPlatform = (platformid) =>
  apiFetch(
    `/detailsofplatform/${platformid}`
  );

export const showRequestDetails = (requestid) =>
  apiFetch(
    `/showrequestdetails/${requestid}`
  );

/* =========================================================
   SAVED REQUESTS
========================================================= */

export const saveRequest = (requestid) =>
  apiFetch("/saverequest", {
    method: "POST",
    body: {
      requestid,
    },
  });

export const showSavedRequests = () =>
  apiFetch("/showsavedrequests");

export const alredySavedOrNot = (requestid) =>
  apiFetch(
    `/alredysavedornot/${requestid}`
  );

export const deleteFalseRequests = () =>
  apiFetch("/deletefalserequests", {
    method: "POST",
    auth: false,
    quiet: true,
  }).catch(() => null);

/* =========================================================
   PLATFORM IMAGE / REPORT
========================================================= */

export const showPlatformImageJson = (
  platformid
) =>
  apiFetch(
    `/showplatformimage/${platformid}`
  );

export const addPlatformImage = (fd) =>
  apiFetch("/addplatformimage", {
    method: "POST",
    body: fd,
    form: true,
  });

export const reportUser = (
  reporteduserid,
  reason
) =>
  apiFetch("/reportuser", {
    method: "POST",
    body: {
      reporteduserid,
      reason,
    },
  });

export const reportBug = (description) =>
  apiFetch("/reportabug", {
    method: "POST",
    body: {
      description,
    },
  });

export const deleteRequest = (requestid) =>
  apiFetch("/deleterequest", {
    method: "POST",
    body: {
      requestid,
    },
  });

/* =========================================================
   PAYMENT PROOFS / GROUP MANAGEMENT
========================================================= */

/*
 * multipart:
 * proofimage + requestid
 */

export const sendPaymentProof = (fd) =>
  apiFetch("/sendpaymentproof", {
    method: "POST",
    body: fd,
    form: true,
  });

export const showAllProofImages = (
  requestid
) => {
  if (!requestid) {
    return Promise.reject(
      new Error("Request ID is required.")
    );
  }

  return apiFetch(
    `/showallproofimage/${encodeURIComponent(
      requestid
    )}`
  );
};

/*
 * Get members currently inside the request.
 *
 * GET /getrequestmembers/:requestid
 */

export const getRequestMembers = (
  requestid
) => {
  if (!requestid) {
    return Promise.reject(
      new Error("Request ID is required.")
    );
  }

  return apiFetch(
    `/getrequestmembers/${encodeURIComponent(
      requestid
    )}`
  );
};

/*
 * Approve payment proof
 *
 * Backend expects:
 * { paymentproofid }
 */

export const approveUser = (
  paymentproofid
) => {
  if (!paymentproofid) {
    return Promise.reject(
      new Error(
        "Payment proof ID is required."
      )
    );
  }

  return apiFetch("/aproveusers", {
    method: "POST",
    body: {
      paymentproofid,
    },
  });
};

/*
 * Reject payment proof
 */

export const rejectUser = (
  paymentproofid
) => {
  if (!paymentproofid) {
    return Promise.reject(
      new Error(
        "Payment proof ID is required."
      )
    );
  }

  return apiFetch("/rejectusers", {
    method: "POST",
    body: {
      paymentproofid,
    },
  });
};

/* =========================================================
   FINAL GROUP
========================================================= */

export const showAllAdminGroups = (
  cursor
) =>
  apiFetch(
    "/showalladmingroups" +
      (cursor
        ? `?cursor=${encodeURIComponent(cursor)}`
        : "")
  );

export const addNewGroup = (groupname) =>
  apiFetch("/addnewgroup", {
    method: "POST",
    body: {
      groupname,
    },
  });

/*
 * Add candidate to final group
 *
 * Backend expects:
 * {
 *   groupid,
 *   candidate,
 *   requestid
 * }
 */

export const addMembers = ({
  groupid,
  candidate,
  requestid,
}) => {
  if (!groupid || !candidate || !requestid) {
    return Promise.reject(
      new Error(
        "groupid, candidate and requestid are required."
      )
    );
  }

  return apiFetch("/addmembers", {
    method: "POST",
    body: {
      groupid,
      candidate,
      requestid,
    },
  });
};

/* =========================================================
   FINAL GROUP PLANS
========================================================= */

export const selectPlatformToFinalGroup = (
  platformid,
  groupid
) =>
  apiFetch("/selectplatformtofinalgroup", {
    method: "POST",
    body: {
      platformid,
      groupid,
    },
  });

export const addPlan = ({
  groupid,
  planname,
  planvalidity,
}) =>
  apiFetch("/addplan", {
    method: "POST",
    body: {
      groupid,
      planname,
      planvalidity,
    },
  });

export const showPlansOfFinalGroup = (
  groupid
) =>
  apiFetch(
    `/showplansofafinalgroup/${groupid}`
  );

export const addSigninDetails = ({
  planid,
  platformemail,
  platformepassword,
}) =>
  apiFetch("/addsignindetails", {
    method: "POST",
    body: {
      planid,
      platformemail,
      platformepassword,
    },
  });

export const showLoginDetails = (planid) =>
  apiFetch(
    `/showlogindetails/${planid}`
  );

export const showUpiId = (userid) =>
  apiFetch(`/showupiid/${userid}`);

export const addUpiId = (upiid) =>
  apiFetch("/addupiid", {
    method: "POST",
    body: {
      upiid,
    },
  });

export const updateUpiId = (upiid) =>
  apiFetch("/updateupiid", {
    method: "POST",
    body: {
      upiid,
    },
  });

export const deleteGroupRequest = (
  groupid
) =>
  apiFetch("/deletegrouprequest", {
    method: "POST",
    body: {
      groupid,
    },
  });

export const acceptDeleteRequest = (
  groupid
) =>
  apiFetch("/acceptdeleterequest", {
    method: "POST",
    body: {
      groupid,
    },
  });

export const rejectDeleteRequest = (
  groupid
) =>
  apiFetch("/rejectdeleterequest", {
    method: "POST",
    body: {
      groupid,
    },
  });

export const showDeleteRequest = (groupid) =>
  apiFetch(
    `/showdeleterequest/${groupid}`
  );

/* =========================================================
   CHAT
========================================================= */

export const MAX_OID =
  "ffffffffffffffffffffffff";

/* ---------------------------------------------------------
   FINAL GROUP CHAT
--------------------------------------------------------- */

export const unseenFinalMessages = (
  groupid,
  cursor
) =>
  apiFetch(
    `/getunsceenfinalgroupmessaeg/${groupid}` +
      (
        cursor
          ? `?cursor=${encodeURIComponent(cursor)}`
          : ""
      ),
    {
      quiet: true,
    }
  );

/* ---------------------------------------------------------
   TEMP GROUP CHAT
--------------------------------------------------------- */

export const unseenTempMessages = (
  requestid,
  cursor
) =>
  apiFetch(
    `/getunsceentempgroupmessaeg/${requestid}` +
      (
        cursor
          ? `?cursor=${encodeURIComponent(cursor)}`
          : ""
      ),
    {
      quiet: true,
    }
  );

/* ---------------------------------------------------------
   FINAL GROUP OLD MESSAGES
   Cursor is required by backend
--------------------------------------------------------- */

export const oldFinalMessages = (
  groupid,
  cursor
) =>
  apiFetch(
    `/showoldmessage/${groupid}?cursor=${encodeURIComponent(
      cursor
    )}`,
    {
      quiet: true,
    }
  );

/* ---------------------------------------------------------
   TEMP GROUP OLD MESSAGES
   Cursor optional
--------------------------------------------------------- */

export const oldTempMessages = (
  requestid,
  cursor
) =>
  apiFetch(
    `/showoldmessageoftempgroup/${requestid}` +
      (
        cursor
          ? `?cursor=${encodeURIComponent(cursor)}`
          : ""
      ),
    {
      quiet: true,
    }
  );

/* ---------------------------------------------------------
   UNSEEN COUNTS
--------------------------------------------------------- */

export const countUnseenFinal = (
  groupid
) =>
  apiFetch(
    `/numberofunsceenmsginfinalgroup/${groupid}`,
    {
      quiet: true,
    }
  );

export const countUnseenTemp = (
  requestid
) =>
  apiFetch(
    `/numberofunsceenmsgintempgroup/${requestid}`,
    {
      quiet: true,
    }
  );

/* =========================================================
   FINAL GROUP AVATAR
========================================================= */

/*
 * Route:
 * POST /addfinalgroupavatar/:groupid
 *
 * multipart field:
 * avatar
 */

export const addFinalGroupAvatar = (
  groupid,
  file
) => {
  if (!groupid) {
    return Promise.reject(
      new Error("Group ID is required.")
    );
  }

  if (!file) {
    return Promise.reject(
      new Error("Avatar file is required.")
    );
  }

  const fd = new FormData();

  fd.append("avatar", file);

  return apiFetch(
    `/addfinalgroupavatar/${encodeURIComponent(
      groupid
    )}`,
    {
      method: "POST",
      body: fd,
      form: true,
    }
  );
};

/* =========================================================
   RESPONSE HELPERS
========================================================= */

function pick(obj, names) {
  if (
    !obj ||
    typeof obj !== "object"
  ) {
    return undefined;
  }

  for (const n of names) {
    if (obj[n] != null) {
      return obj[n];
    }
  }

  for (const v of Object.values(obj)) {
    if (
      v &&
      typeof v === "object"
    ) {
      for (const n of names) {
        if (v[n] != null) {
          return v[n];
        }
      }
    }
  }

  return undefined;
}

/* =========================================================
   PROFILE NORMALIZER
========================================================= */

export function normalizeProfile(data) {
  return {
    id:
      pick(data, [
        "_id",
        "id",
      ]) || "",

    profilename:
      pick(data, [
        "profilename",
        "profileName",
        "username",
        "name",
      ]) || "",

    avatar:
      pick(data, [
        "avatar",
        "avatarUrl",
        "avatar_url",
        "photo",
        "image",
      ]) || "",
  };
}

/* =========================================================
   AVATAR URL
========================================================= */

export function avatarSrc(a) {
  if (!a) {
    return "";
  }

  if (typeof a === "string") {
    if (
      a.startsWith("data:") ||
      /^https?:\/\//.test(a)
    ) {
      return a;
    }

    return (
      API_URL +
      (a.startsWith("/")
        ? a
        : "/" + a)
    );
  }

  return a.url || a.src || "";
}

/* =========================================================
   COUNT NORMALIZER
========================================================= */

export function parseCount(data) {
  if (typeof data === "number") {
    return data;
  }

  const n = pick(data, [
    "notifications",
    "count",
    "notificationcount",
    "notificationCount",
    "new",
    "total",
    "unseen",
    "message",
  ]);

  const v = parseInt(n, 10);

  return Number.isFinite(v)
    ? v
    : 0;
}

/* =========================================================
   NOTIFICATIONS NORMALIZER
========================================================= */

export function parseNotifications(data) {
  if (Array.isArray(data)) {
    return data;
  }

  const list = pick(data, [
    "notifications",
    "list",
    "items",
    "data",
  ]);

  return Array.isArray(list)
    ? list
    : [];
}
export const showAllGroups = (cursor) =>
  apiFetch(
    "/showallusergroups" +
      (cursor ? `?cursor=${encodeURIComponent(cursor)}` : "")
  );

  //---------------------------------------------------------------------


 /* =========================================================
   ADMIN API
   Uses admin_session cookie
   Separate from normal user JWT auth
========================================================= */

export async function adminApiFetch(
  path,
  {
    method = "GET",
    body,
  } = {}
) {
  let res;

  try {
    res = await fetch(API_URL + path, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Unable to connect to server");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      data?.detail ||
      `Request failed (${res.status})`
    );
  }

  return data;
}


/* -------------------------
   ADMIN LOGIN
------------------------- */

export const adminLogin = ({ email, password }) =>
  adminApiFetch("/adminlogin", {
    method: "POST",
    body: {
      email,
      password,
    },
  });


/* -------------------------
   ADMIN LOGOUT
------------------------- */

export const adminLogout = () =>
  adminApiFetch("/adminlogout", {
    method: "POST",
  });


/* -------------------------
   ADMIN STATS
------------------------- */

export const getAdminStats = () =>
  adminApiFetch("/getadminstats");


/* -------------------------
   REPORTS
------------------------- */

export const getAdminReports = () =>
  adminApiFetch("/showreports");

export const validateReport = ({
  reportid,
  status,
}) =>
  adminApiFetch("/validatereport", {
    method: "POST",
    body: {
      reportid,
      status,
    },
  });


/* -------------------------
   BUGS
------------------------- */

export const getAdminBugs = () =>
  adminApiFetch("/showbugs");

export const validateBug = (reportbugid) =>
  adminApiFetch("/validatebugs", {
    method: "POST",
    body: {
      reportbugid,
    },
  });


/* -------------------------
   ADMIN MANAGEMENT
------------------------- */

export const addAdmin = ({
  username,
  email,
  password,
  fullname,
}) =>
  adminApiFetch("/addadmin", {
    method: "POST",
    body: {
      username,
      email,
      password,
      fullname,
    },
  });


export const deleteAdmin = (adminid) =>
  adminApiFetch("/deleteadmin", {
    method: "POST",
    body: {
      adminid,
    },
  });