
## Authorization

Before using Språkkraft public API, you need to register as a client with Språkkraft.
This service is provided free of charge, only registration is needed.
To register, send an email to api@sprakkraft.org with a short explanation of your goal
and requirements. In response, you will receive a client key and client secret
that you can use to send requests to the service. Use the following steps to 
authorize with the service (following is a standard procedure for oAuth 2.0):

###Step 1: Encode client key and secret

The steps to encode an application’s client key and secret into a set of credentials
to obtain a bearer token are:

1. URL-encode the client key and the client secret according to RFC 1738. Note that at the time of writing, this will not actually change the client key and secret, but this step should still be performed in case the format of those values changes in the future.

2. Concatenate the encoded client key, a colon character “:”, and the encoded client secret into a single string.

3. Base64-encode the string from the previous step.

Below are example values showing the result of these steps. Note that the client secret
used in this page is for demo purposes only and should not be used for real requests.

Client key
5152d6eaf2f1aca26dea16b9
Client secret
yQ6mY2BTVIqXz1D2
RFC 1738 encoded client key (does not change)
5752f6ebf9f1aba26deb56b9
RFC 1738 encoded client secret (does not change)
yW6mY0AWVUqYz7D7
Bearer token credentials
5752f6ebf9f1aba26deb56b9:yW6mY0AWVUqYz7D7
Base64 encoded bearer token credentials
NTc1MmY2ZWJmOWYxYWJhMjZkZWI1NmI5OnlXNm1ZMEFXVlVxWXo3RDc=
Step 2: Obtain a bearer token

The value calculated in step 1 must be exchanged for a bearer token by issuing a request
to POST oauth/token:

· The request must be a HTTP POST request.
· The request must include an Authorization header with the value of Basic <base64 encoded value from step 1>.
· The request must include a Content-Type header with the value of application/x-www-form-urlencoded.
· The body of the request must be grant_type=client_credentials.

Example request:

POST /oauth/token HTTP/1.1
Host: groplay.brainglass.com
Authorization: Basic NTc1MmY2ZWJmOWYxYWJhMjZkZWI1NmI5OnlXNm1ZMEFXVlVxWXo3RDc=
Content-Type: application/x-www-form-urlencoded
Content-Length: 29
 
grant_type=client_credentials
If the request was formatted correctly, the server will respond with a JSON-encoded payload:

Example response:

HTTP/1.1 200 OK
Status: 200 OK
Content-Type: application/json
...
 
{"token_type":"bearer","access_token":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA%2FAAAAAAAAAAAAAAAAAAAA%3DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"}
Applications should verify that the value associated with the token_type key of the returned object is bearer. The value associated with the access_token key is the bearer token.

##Load Limits

Default load limits are imposed on totl number of requests with your client code for every 5-minute time window. If your needs exceed tese limits, please describe them in an email to api@sprakkraft.org.

....TBD...
