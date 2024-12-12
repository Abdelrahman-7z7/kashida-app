class APIFeatures{
    //implementing constructor
    constructor(query, queryString){
        this.query = query
        this.queryString = queryString
    }

    //filter for building query
    filter(){
        //1) filtering 
        //since we might have some query that is not in the document we have to filter out before sending it
        //the three dots in here basically take all the fields and filter it out of the object, and {} creates a new Object
        //ex: /api/k1/posts?categories=Naskh&page=2
        const queryObj = {...this.queryString}
        const excludeFields = ['page', 'sort', 'limit', 'fields']
        excludeFields.forEach(field => delete queryObj[field])

        //2) advanced filtering
        // ex: 127.0.0.1:8000/api/v1/posts?tags=lifeoutside&duration[gte]=5
        // gte (greater than or equal), gt, lte (less than or equal), lt
        //filter obj {difficulty: 'difficult, duration: { $gte: 5} } ==> which means >= than 5 ==> In mongoDB

         // Handle categories as an array for $in
        if (queryObj.categories) {
            const categoriesArray = queryObj.categories.split(',');
            queryObj.categories = { $in: categoriesArray };
        }

        // Handle description query
        if (queryObj.description) {
            queryObj.description = { $regex: queryObj.description, $options: 'i' }; // 'i' for case-insensitive search
        }

        let queryStr = JSON.stringify(queryObj)
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)

        //we filter out the data from the posts etc. models before we sending its query
        this.query = this.query.find(JSON.parse(queryStr))
        
        //returning the entire object
        return this
    }

    //sorting
    sort(){
        //api/v1/posts?sort=createdAt (ascending order)
        //api/v1/tours?sort=-createdAt (descending order)
        //sorting based on two criteria  sort=createdAt,-updatedAt
        if(this.queryString.sort){
            const sortBy = this.queryString.sort.split(',').join(' ')
            console.log(sortBy)
            this.query = this.query.sort(sortBy);
        }

        //returning the entire object
        return this
    }

    //fields limiting
    limitFields(){
        //ex: api/v1/posts?fields=name,createdAt,likesCount
        if(this.queryString.fields){
            const fields = this.queryString.fields.split(',').join(' ')
            this.query = this.query.select(fields);
        }else{
            //default
            //we are removing the __v default mongoDB with the "-" which means eliminate
            this.query = this.query.select('-__v')
        }

        //returning the entire object
        return this
    }

    //pagination
    pagination(){
        //ex: api/v1/posts?page=2&limit=10
        // *1 ==> converting the string to a number, ||1 ==> or page 1 which is the default page
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;

        //page=3&limit=10, 1-10 page 1, 11-20 page 2, 21-30 page 3...
        this.query = this.query.skip(skip).limit(limit)

        //returning the entire object
        return this
    }
}

module.exports = APIFeatures;