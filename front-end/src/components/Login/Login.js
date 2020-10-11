import React, { useState, useContext } from 'react'
import { useHistory } from 'react-router-dom'
import UserContext from '../../context/UserContext'
import Axios from 'axios'

import Errors from '../Errors/Errors'

export default function Login() {
    const [email, setEmail] = useState();
    const [password, setPassword] = useState();
    const [userToken, setUserToken] = useState();

    const [FALogin, setFALogin] = useState({ secret: undefined, qrcode: undefined });
    const [tokenCode, setTokenCode] = useState();

    const [error, setError] = useState();
    const [error2FA, setError2FA] = useState();

    const { setUserData } = useContext(UserContext);

    const history = useHistory();

    const login = async (e) => {
        e.preventDefault();
        let loginRes, FALoginRes;

        try{
            loginRes = await Axios.post('http://localhost:5000/users/login', { email, password })
            setUserData({
                token: loginRes.data.token,
                user: loginRes.data.user
            });
            setUserToken(loginRes.data.token);
        } catch(err){
            err.response.data.msg && setError(err.response.data.msg);
        }

        try {
            FALoginRes = await Axios.post('http://localhost:5000/users/2fa-login', { userToken: loginRes.data.user.id });
            setFALogin({
                secret: FALoginRes.data.secret,
                qrcode: FALoginRes.data.qrcode
            });
        } catch(err){
            err.response.data.msg && setError2FA(err.response.data.msg);
        }
    }

    const verify = async (e) => {
        e.preventDefault();
        let isCodeValid;
        
        try {
            isCodeValid = await Axios.post('http://localhost:5000/users/2fa-verify', { secret: FALogin.secret, tokenCode: tokenCode });
            if(isCodeValid.data){
                localStorage.setItem('auth-token', userToken);
                history.push("/");
            } else {
                setError2FA("Incorrect Code");
            }
        } catch(err) {
            err.response.data.msg && setError2FA(err.response.data.msg);
        }
    }

    return (
        <div className="page">
            <h2>Log In</h2>
            {error && <Errors message={error} clearError={() => {setError(undefined)}} />}
            <form className="form" onSubmit={login}>
                <label htmlFor="login-email">Email</label>
                <input id="login-email" type="email" onChange={ e => setEmail(e.target.value)}/>

                <label htmlFor="login-pass">Contraseña</label>
                <input id="login-pass" type="password" onChange={ e => setPassword(e.target.value)}/>

                <input type="submit" value="Log In" />
            </form>
            { FALogin.qrcode ? (
                <div >
                    <hr/>
                    <h4 align="center">2-Factor Authentication</h4>
                    {error2FA && <Errors message={error2FA} clearError={() => {setError2FA(undefined)}} />}
                    <img className="center" src={FALogin.qrcode} alt="This is the QR Code"></img>
                    <br/>
                    <form className="form" onSubmit={verify}>
                        <label htmlFor="verify-code">Ingresar código</label>
                        <input id="verify-code" type="text" onChange={ e => setTokenCode(e.target.value)}/>

                        <input type="submit" value="Ingresar" />
                    </form>

                </div>
            ):(
                null
            )}
        </div>
    )
}
