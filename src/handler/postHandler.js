const postHandler = {}
const { ifError } = require("assert")
const { error } = require("console")
const https = require("https")
const { resolve } = require("path")
const { callbackify } = require("util")

const apiPost = "https://jsonplaceholder.typicode.com/posts"
const apiComments = "https://jsonplaceholder.typicode.com/comments"

//program mengubah properti yang ada pada api post
const perubahanKeyPost = (data) => {
    return data.map(item => {
        return {
            userId: item.userId,
            postId: item.id,
            judulPost: item.title,
            content: item.body
        };
    });
}

//program mengubah properti yang ada pada api comment
const perubahanKeyComment = (data) => {
    return data.map(item => {

        delete item.id //menghapus properti id pada api comment
        return {
            postId: item.postId,
            name: item.name,
            email: item.email,
            content: item.body
        }
    })
}


postHandler.getAllPost = (req, res) => {
    https.get(apiPost, (responApi) => {
        let data = "";

        //mengirim potongan data dari api post dan dimasukan kedalam variable data
        responApi.on('data', (chunk) => {
            data = data + chunk;
        });

        responApi.on('end', () => {
            try {
                const dataJson = JSON.parse(data);
                const keyTerubah = perubahanKeyPost(dataJson);

                res.writeHead(200, {
                    'Content-Type': 'application/json'
                });
                res.end(JSON.stringify(keyTerubah)); //menampilkan data api dalam bentuk string
            } catch (error) {
                console.error('Error saat menguraikan JSON:', error);
                res.writeHead(500, {
                    'Content-Type': 'text/plain'
                });
                res.end('Error');
            }
        });
    }).on('error', (error) => {
        console.error('Error saat mengambil data dari API:', error);
        res.writeHead(500, {
            'Content-Type': 'text/plain'
        });
        res.end('Error');
    });
}

postHandler.getAllComment = (req, res) => {
    https.get(apiComments, (responApi) => {
        let data = "";

        responApi.on('data', (chunk) => {
            data = data + chunk
        })

        responApi.on('end', () => {
            try {
                const dataJson = JSON.parse(data);
                const keyTerubah = perubahanKeyComment(dataJson);

                res.writeHead(200, {
                    'Content-Type': 'application/json'
                });
                res.end(JSON.stringify(keyTerubah));
            } catch (error) {
                console.error('Error saat menguraikan JSON:', error);
                res.writeHead(500, {
                    'Content-Type': 'text/plain'
                });
                res.end('Error');
            }
        });
    }).on('error', (error) => {
        console.error('Error saat mengambil data dari API', error)
        res.writeHead(500, {
            'Content-Type': 'text/plain'
        })
        res.end('Error')
    })
}

const fetchApiData = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (responApi) => {
            let data = '';

            responApi.on('data', (chunk) => {
                data += chunk;
            });

            responApi.on('end', () => {
                try {
                    const dataJson = JSON.parse(data);
                    resolve(dataJson);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
};

const joinPostAndComment = async () => {
    try {
        const [posts, comments] = await Promise.all([
            fetchApiData(apiPost),
            fetchApiData(apiComments),
        ]);

        // Membuat objek map dengan empat komentar untuk setiap posting
        const postsWithMultipleComments = posts.map((post) => {
            const postComments = comments
                .filter((comment) => comment.postId === post.id)
                .slice(0, 4); // Ambil empat komentar pertama

            delete post.userId

            const commentsWithoutId = postComments.map(({ id, name, email, body, ...commentData }) => ({
                ...commentData,
                nameUser: name,
                emailUser: email,
                contentComment: body // Mengubah properti 'name' menjadi 'nameUser'
            }));

            return {
                id: post.id,
                judulPost: post.title,
                contentPost: post.body,
                comments: postComments,
                comments: commentsWithoutId
            };
        });

        return postsWithMultipleComments;
    } catch (error) {
        throw error;
    }
};

postHandler.getAllPostAndComment = async (req, res) => {
    try {
        const keyTerubah = await joinPostAndComment();

        res.writeHead(200, {
            'Content-Type': 'application/json',
        });
        res.end(JSON.stringify(keyTerubah));
    } catch (error) {
        console.error('Error saat mengambil data dari API:', error);
        res.writeHead(500, {
            'Content-Type': 'text/plain',
        });
        res.end('Error');
    }
};


// function getDataFromApi(apiUrl, callback) {
//     https.get(apiUrl, (responApi) => {
//         let data = "";

//         responApi.on('data', (chunk) => {
//             data = data + chunk;
//         });

//         responApi.on('end', () => {
//             const jsonData = JSON.parse(data);
//             callback(jsonData); // Panggil callback dengan data yang diterima dari API
//         });
//     }).on('error', (error) => {
//         console.error('Error saat mengambil data dari API:', error);
//         callback([]); // Panggil callback dengan array kosong jika terjadi kesalahan
//     });
// }

// function getAllData(req, res) {
//     // Menggunakan Promise.all untuk mengambil data dari kedua API secara bersamaan
//     Promise.all([
//         new Promise((resolve) => getDataFromApi(apiPost, resolve)),
//         new Promise((resolve) => getDataFromApi(apiComments, resolve)),
//     ]).then(([postData, commentData]) => {
//         // Menyisipkan data komentar ke dalam setiap objek posting
//         postData.forEach((post) => {
//             post.comments = commentData.filter((comment) => comment.postId === post.id);
//         });

//         res.writeHead(200, {
//             'Content-Type': 'application/json'
//         });
//         res.end(JSON.stringify(postData));
//     }).catch((error) => {
//         console.error('Error saat menggabungkan data:', error);
//         res.writeHead(500, {
//             'Content-Type': 'text/plain'
//         });
//         res.end('Error');
//     });
// }

// postHandler.getAllData = (req, res) => {

//     const getDataFromApi = () => {

//         https.get(apiUrl, (responApi) => {

//             let data = ""

//             responApi.on('data', (chunk) => {
//                 data = data + chunk

//             })

//             responApi.on('end', () => {

//                 const jsonData = JSON.parse(data)
//                 callback(jsonData)
//             })
//         }).on('error', (error) => {

//             console.error('Error saat mengambil data dari API : ', error)
//             callback([])
//         })
//     }

//     Promise.all([

//         new Promise((resolve) => getDataFromApi(apiPost, resolve)),
//         new Promise((resolve) => getDataFromApi(apiComments, resolve))
//     ]).then(([postData, commentData]) => {

//         postData.forEach((post) => {

//             post.comments = commentData.filter((comment) => comment.postId === post.id)
//         })

//         res.writeHead(200, {
//             'Content-Type': 'application/json'
//         })
//         res.end(JSON.stringify(postData))
//     }).catch((error) => {

//         console.error('Error saat menggabungkan data:', error);
//         res.writeHead(500, {
//             'Content-Type': 'text/plain'
//         });
//         res.end('Error');
//     })

// }



module.exports = postHandler
