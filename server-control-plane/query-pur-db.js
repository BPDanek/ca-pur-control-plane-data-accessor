function getPesticideCounts(pesticide_count_promises, counties) {
    // query db using pgPromise for async db access. http://vitaly-t.github.io/pg-promise/Database.html#one
    for (var row_index = 0; row_index < counties.length; row_index++) {

        // build query for route parameters
        const query = `SELECT pesticide_count FROM ca_reduced_udc WHERE county_cd = '${counties[row_index]}';`

        console.log("query: ", query)

        // unpack count and push to an array of async requests/Promises
        pesticide_count_promises.push(
            db.oneOrNone(query)
                .then((queryResponse) => {
                    console.log(query, queryResponse.pesticide_count)
                    return queryResponse.pesticide_count })
                .catch(() => {
                    console.log("failure on", query)
                    return 0
                })
        )
    }
}

function getMaxPesticideCount(pesticide_count_promises) {
    const maxPesticideCountQuery = 'SELECT MAX(pesticide_count) FROM ca_reduced_udc;'
    pesticide_count_promises.push(
        db.oneOrNone(maxPesticideCountQuery)
            .then((data) => { return data.max })
            .catch(() => {
                console.log('Using default max pesticide count. Query failed: ', maxPesticideCountQuery)
                return 579034
            } )
    )
}

// modify pesticide_count_promises in place
function queryPURTable(pesticide_count_promises, counties) {
    getPesticideCounts(pesticide_count_promises, counties)
    getMaxPesticideCount(pesticide_count_promises)
}
