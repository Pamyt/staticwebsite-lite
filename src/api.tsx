import axios from "axios";

const TIMEOUT = 1000000;
const API_BASE_URL = "https://djw3crnmuc.ap-southeast-2.awsapprunner.com";

export function postmessage(message: string) {
    return axios.post(`${API_BASE_URL}/llm_talk`, {
        query: message,
    }, {
        timeout: TIMEOUT
    });
}
