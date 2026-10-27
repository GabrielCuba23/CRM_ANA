import React from 'react';
import anaLogo from '../assets/ana-logo.png';

export default function AnaLogo({className=''}) {
  return <img className={`ana-logo ${className}`} src={anaLogo}
    alt="ANA · Autoridad Nacional del Agua" width={929} height={412} decoding="async"/>;
}
