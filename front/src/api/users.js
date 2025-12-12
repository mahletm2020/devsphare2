import axiosClient from "./axiosClient";

export const searchUsers = (q , rolse)=>
    axiosClient.get('users' , {params:{search:q, role  }});