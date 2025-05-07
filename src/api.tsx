import axios from "axios";

const TIMEOUT = 1000000;
const API_BASE_URL = "https://master.dsc8hjp5let50.amplifyapp.com/api";

export function postmessage(message: string) {
    return axios.post(`${API_BASE_URL}/llm_talk`, {
        query: message,
    }, {
        timeout: TIMEOUT
    });
}
