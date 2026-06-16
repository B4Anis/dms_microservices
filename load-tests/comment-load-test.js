import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
    stages: [
        { duration: '2m', target: 100 },
    ],
};

export default function () {
    const url = 'http://localhost:8081/api/comments';
    const payload = JSON.stringify({
        docId: 1,
        content: "Load test comment",
        author: "K6_User"
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    http.post(url, payload, params);
}
