import 'next-auth'

declare module 'next-auth' {
  interface Session {
    id: string
    
  }
}

// next-auth 모듈에 대한 선언을 시작하며, interface Session을 확장하여 
//Session 객체에 id 속성을 추가하고 있습니다. 
//이로써 Session 객체가 id 속성을 가질 수 있다는 것을 TypeScript에 알려주는 것