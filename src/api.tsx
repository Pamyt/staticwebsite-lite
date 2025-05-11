import axios from "axios";

const TIMEOUT = 1000000;
const API_BASE_URL = "https://pryevz3dwx.ap-southeast-2.awsapprunner.com";

export function postmessage(message: string, randomNumber: number) {
    return axios.post(`${API_BASE_URL}/llm_talk`, {
        query: message,
        conversation_id: randomNumber,
    }, {
        timeout: TIMEOUT
    });
}
