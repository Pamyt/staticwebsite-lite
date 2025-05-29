import axios from "axios";

const TIMEOUT = 1000000;
export const API_BASE_URL = "https://pryevz3dwx.ap-southeast-2.awsapprunner.com";

export function postmessage(message: string, userid: number, conversation_id: number) {
    return axios.post(`${API_BASE_URL}/llm_talk`, {
        query: message,
        user_id: Number(userid),
        conversation_id: String(conversation_id)
    }, {
        timeout: TIMEOUT
    });
}
export function postdeepsearch(userid: number, conversation_id: number, destination: string, budget: string, dates: string, preferences: string, currentLocation: string) {
    return axios.post(`${API_BASE_URL}/answer_deepsearch`, {
        user_id: Number(userid),
        conversationid: String(conversation_id),
        destination,
        budget,
        dates,
        preferences,
        startpoint: currentLocation
    }, {
        timeout: TIMEOUT
    });
}
export function getlocation(userid: number, conversation_id: number) {
    return axios.post(`${API_BASE_URL}/show_lattest_longtitude_latitude`, {
        user_id: Number(userid),
        conversation_id: String(conversation_id)
    }, {
        timeout: TIMEOUT
    });
}
export function login(username: string, password: string) {
    return axios.post(`${API_BASE_URL}/user_login`, {
        name: username,
        password
    }, {
        timeout: TIMEOUT
    });
}
export function register(username: string, password: string) {
    return axios.post(`${API_BASE_URL}/create_user`, {
        name: username,
        password
    }, {
        timeout: TIMEOUT
    });
}
export function getallconvid(userid: number) {
    return axios.post(`${API_BASE_URL}/get_user_conversation_ids`, {
        user_id: userid
    }, {
        timeout: TIMEOUT
    });
}
export function getdsconvid(userid: number) {
    return axios.get(`${API_BASE_URL}/get_deepsearch_conversation_ids_by_user?user_id=${userid}`, { timeout: TIMEOUT });
}
export function getdscontentbyid(userid: number, conversation_id: number) {
    return axios.get(`${API_BASE_URL}/get_deepsearch_conversation_by_id?conversationid=${conversation_id}`, {
        timeout: TIMEOUT
    });
}
export function getcontentbyid(userid: number, conversation_id: number) {
    return axios.post(`${API_BASE_URL}/get_conversation_content_by_id`, {
        user_id: Number(userid),
        conversation_id: String(conversation_id)
    }, {
        timeout: TIMEOUT
    });
}
export function getallpost() {
    return axios.get(`${API_BASE_URL}/get_all_post`, {},);
}
export function makepost(userid: number, post_title: string, content: string, travel_place: string,) {
    return axios.post(`${API_BASE_URL}/make_post`, {
        user_id: Number(userid),
        post_title,
        post_content: content,
        travel_place,
    }, {
        timeout: TIMEOUT
    });
}
export function likepost(userid: number, post_id: number) {
    return axios.post(`${API_BASE_URL}/like_post`, {
        user_id: Number(userid),
        post_id: Number(post_id)
    }, {
        timeout: TIMEOUT
    });
}
export function dislikepost(userid: number, post_id: number) {
    return axios.post(`${API_BASE_URL}/dislike_post`, {
        user_id: Number(userid),
        post_id: Number(post_id)
    }, {
        timeout: TIMEOUT
    });
}