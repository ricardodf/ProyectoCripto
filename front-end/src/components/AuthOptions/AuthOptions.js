import React, { useContext } from 'react'
import { useHistory } from 'react-router-dom'

import UserContext from '../../context/UserContext';

export default function AuthOptions() {
    const { userData, setUserData } = useContext(UserContext);

    const history = useHistory();

    const register = () => history.push("/register");
    const login = () => history.push("/login");
    const logout = () => {
        setUserData({
            token: undefined,
            user: undefined
        });
        localStorage.setItem('auth-token', "");
    };

    return (
        <nav className="options">
            { userData.user ? (
                    <button onClick={logout}>Log Out</button>
                ) : (
                    <>
                        <button onClick={register}>Register</button>
                        <button onClick={login}>Log In</button>
                    </>
                )
            }
        </nav>
    )
}
