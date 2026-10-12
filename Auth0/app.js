const domain = "dev-qobifdinyeq8mo3s.us.auth0.com";
const ClientID = "eeHS9tVQgZGFsCsNmL43VFVckAp96CZW";

let auth0Client;

async function init(){
    auth0Client = await auth0.createAuth0Client({
        domain:domain,
        clientId:ClientID,
        authorizationParams: {
            redirect_uri: window.location.origin
        }
    });

    if(window.location.search.includes("code=")){
        await auth0Client.handleRedirectCallback();
        window.history.replaceState(
            {}, document.title, window.location.pathname
        );
    }

    await showUser();
}

async function login(){
    await auth0Client.loginWithRedirect();
}

async function signup(){
    await auth0Client.loginWithRedirect({
        authorizationParams:{
            screen_hint: "signup"
        }
    });
}

async function logout(){
    auth0Client.logout({
        logoutParams:{
            returnTo: window.location.origin
        }
    });
}

async function showUser(){
    if (await auth0Client.isAuthenticated()){
        const user = await auth0Client.getUser();

        document.getElementById("message").innerText = "Welcome "+user.name;
        document.getElementById("email").innerText = user.email || "";
    }
}
init();