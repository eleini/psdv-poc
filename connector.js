//----------------------------------CONNECTOR FOR PSDV22 SEMINAR PROJECT----------------------------------
//PACKAGES
var mysql = require('mysql2');
const axios = require('axios');
var sslRootCAs = require('ssl-root-cas');
const https = require('https');

//ignore SSL issues
sslRootCAs.inject()
axios.defaults.httpsAgent = new https.Agent({ rejectUnauthorized: false })

//create connection to mysql database
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Cgh--780",
    database: 'psdv'
});

//our api endpoints

//let url = 'https://api.crossref.org/works?rows=10';

let url = 'https://api.test.datacite.org/dois?random=true&page[size]=10';

//retrieve results in json format and push results in respective arrays according to db design
axios
    .get(url)
    .then(res => {
        let items;
        let insertValuesPublication = [];
        let insertValuesPubAuthors = [];
        let insertValuesPubTypes = [];

        if (url.includes("crossref")) {
            items = res.data.message.items
            for (const item of items) {
                //console.log(String(item.DOI) + ": " + String(item.author?.[0]['family']));       
                insertValuesPublication.push(
                    {
                        "doi": String(item.DOI),
                        "publisher": String(item.publisher),
                        "url": String(item.URL),
                        "title": String(item.title),
                        "language": String(item.language),
                        "date": String(item.created['date-parts'][0][0])
                    }
                );
                insertValuesPubAuthors.push(
                    {
                        "doi": String(item.DOI),
                        "firstAuthor": String(item?.author?.[0]['family']),
                        "secondAuthor": String(item?.author?.[1]['family'])
                    }
                );
                insertValuesPubTypes.push(
                    {
                        "doi": String(item.DOI),
                        "publicationType": String(item.type)
                    }
                );
            }
        }
        if (url.includes("datacite")) {
            items = res.data.data
            //console.log(items)
            for (const item of items) {
                insertValuesPublication.push(
                    {
                        "doi": String(item.attributes.doi),
                        "publisher": String(item.attributes.publisher),
                        "url": String(item.attributes.url),
                        "title": String(item.attributes.titles[0]['title']),
                        "language": String(item.attributes.language),
                        "date": String(item.attributes.publicationYear)
                    }
                );
                insertValuesPubAuthors.push(
                    {
                        "doi": String(item.attributes.doi),
                        "firstAuthor": String(item?.attributes?.creators?.[0]?.['name']),
                        "secondAuthor": String(item?.attributes?.creators?.[1]?.['name'])
                    }
                );
                insertValuesPubTypes.push(
                    {
                        "doi": String(item.attributes.doi),
                        "publicationType": String(item.attributes.types['citeproc'])
                    }
                );
            }
        }
        //console.log("insertValues: ", insertValues);

        //define value arrays for flattened json content
        let publication_values = []; //for table publication
        let authors_values = [];     //for table pub_authors
        let pub_types_values = [];   //for table pub_types

        for (var i = 0; i < insertValuesPublication.length; i++) {
            publication_values.push([insertValuesPublication[i].doi, insertValuesPublication[i].publisher, insertValuesPublication[i].url, insertValuesPublication[i].title, insertValuesPublication[i].language, insertValuesPublication[i].date]);
        }
        for (var i = 0; i < insertValuesPubAuthors.length; i++) {
            authors_values.push([insertValuesPubAuthors[i].doi, insertValuesPubAuthors[i].firstAuthor, insertValuesPubAuthors[i].secondAuthor]);
        }
        for (var i = 0; i < insertValuesPubTypes.length; i++) {
            pub_types_values.push([insertValuesPubTypes[i].doi, insertValuesPubTypes[i].publicationType]);
        }

        //console.log("values: ", values);
        //connect to the db and insert data
        con.connect(function (err) {
            if (err) throw err;
            console.log("Connected!");
            var sql_publication = `INSERT INTO publication (doi, publisher, url, title, language, date) VALUES ?`
            var sql_authors = `INSERT INTO pub_authors (doi, firstAuthor, secondAuthor) VALUES ?`
            var sql_pub_types = `INSERT INTO pub_types (doi, publicationType) VALUES ?`
            con.query(sql_publication, [publication_values], function (err, result) {
                if (err) throw err;
                console.log("publications inserted");
            });
            con.query(sql_authors, [authors_values], function (err, result) {
                if (err) throw err;
                console.log("pub_authors inserted");
            });
            con.query(sql_pub_types, [pub_types_values], function (err, result) {
                if (err) throw err;
                console.log("pub_types inserted");
            });
        })
    })
    .catch(error => {
        console.error(error);
    });




