import React from 'react'
import Header from '../../ShareModules/Layout/Header/Header';
import EmptyState from './EmptyState';
import "./lend.scss"
const Index=()=> {
  return (
    <>
    <Header z={true} />
      <div className='lend'>
        <EmptyState/>
      </div>
    </>

  )
}

export default Index;