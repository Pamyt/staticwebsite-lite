import axios from "axios";

const TIMEOUT = 1000000;
const API_BASE_URL = "https://pryevz3dwx.ap-southeast-2.awsapprunner.com";

export function postmessage(message: string, userid: number, conversation_id: number) {
    return axios.post(`${API_BASE_URL}/llm_talk`, {
        query: message,
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
export function getcontentbyid(userid: number, conversation_id: number) {
    return axios.post(`${API_BASE_URL}/get_conversation_content_by_id`, {
        user_id: Number(userid),
        conversation_id: String(conversation_id)
    }, {
        timeout: TIMEOUT
    });
}