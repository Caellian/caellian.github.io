export interface PostfixedNumber<T> {
  value: number;
  t: T;
}

export enum UnitType {
  em = "em",
  ex = "ex",
  percent = "%",
  px = "px",
  cm = "cm",
  mm = "mm",
  in = "in",
  pt = "pt",
  pc = "pc",
  ch = "ch",
  rem = "rem",
  vh = "vh",
  vw = "vw",
  vmin = "vmin",
  vmax = "vmax",
}

export interface Unit extends PostfixedNumber<UnitType> {}
export module Unit {
  export function em(value: number): Unit {
    return {
      value,
      t: UnitType.em,
    };
  }

  export function ex(value: number): Unit {
    return {
      value,
      t: UnitType.ex,
    };
  }

  export function percent(value: number): Unit {
    return {
      value,
      t: UnitType.percent,
    };
  }

  export function px(value: number): Unit {
    return {
      value,
      t: UnitType.px,
    };
  }

  export function cm(value: number): Unit {
    return {
      value,
      t: UnitType.cm,
    };
  }

  export function mm(value: number): Unit {
    return {
      value,
      t: UnitType.mm,
    };
  }

  export function inch(value: number): Unit {
    return {
      value,
      t: UnitType.in,
    };
  }

  export function pt(value: number): Unit {
    return {
      value,
      t: UnitType.pt,
    };
  }

  export function pc(value: number): Unit {
    return {
      value,
      t: UnitType.pc,
    };
  }

  export function ch(value: number): Unit {
    return {
      value,
      t: UnitType.ch,
    };
  }

  export function rem(value: number): Unit {
    return {
      value,
      t: UnitType.rem,
    };
  }

  export function vh(value: number): Unit {
    return {
      value,
      t: UnitType.vh,
    };
  }

  export function vw(value: number): Unit {
    return {
      value,
      t: UnitType.vw,
    };
  }

  export function vmin(value: number): Unit {
    return {
      value,
      t: UnitType.vmin,
    };
  }

  export function vmax(value: number): Unit {
    return {
      value,
      t: UnitType.vmax,
    };
  }
}

export function neg_unit(u: Unit): Unit {
  return {
    value: -u.value,
    t: u.t,
  };
}

export interface Angle extends PostfixedNumber<AngleType> {}
export module Angle {
  export function deg(value: number): Angle {
    return {
      value,
      t: AngleType.deg,
    };
  }

  export function grad(value: number): Angle {
    return {
      value,
      t: AngleType.grad,
    };
  }

  export function rad(value: number): Angle {
    return {
      value,
      t: AngleType.rad,
    };
  }

  export function turn(value: number): Angle {
    return {
      value,
      t: AngleType.turn,
    };
  }
}

export enum AngleType {
  deg = "deg",
  grad = "grad",
  rad = "rad",
  turn = "turn",
}

export function unit_to_css(
  num: PostfixedNumber<UnitType | AngleType>
): string {
  return `${num.value}${num.t}`;
}

type Matrix = [number, number, number, number, number, number];
type Matrix3D = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

type Rotate3D = [number, number, number, Angle];
type Translate = Unit | [Unit, Unit];
type Translate3D = [Unit, Unit, Unit];
type Scale = [number] | [number, number];
type Scale3D = [number, number, number];
type Skew = [Angle, Angle];

export interface Transform {
  matrix?: Matrix;
  matrix3d?: Matrix3D;
  perspective?: Unit;
  rotate?: Angle;
  rotate3d?: Rotate3D;
  rotateX?: Angle;
  rotateY?: Angle;
  rotateZ?: Angle;
  translate?: Translate;
  translate3d?: Translate3D;
  translateX?: Unit;
  translateY?: Unit;
  translateZ?: Unit;
  scale?: Scale;
  scale3d?: Scale3D;
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  skew?: Skew;
  skewX?: Angle;
  skewY?: Angle;
}
export module Transform {
  export const FUNCTIONS = [
    "matrix",
    "matrix3d",
    "perspective",
    "rotate",
    "rotate3d",
    "rotateX",
    "rotateY",
    "rotateZ",
    "translate",
    "translate3d",
    "translateX",
    "translateY",
    "translateZ",
    "scale",
    "scale3d",
    "scaleX",
    "scaleY",
    "scaleZ",
    "skew",
    "skewX",
    "skewY",
  ];
}

function stringify_params(params: any): string {
  if (typeof params === "string") {
    return params;
  }

  if (typeof params === "object") {
    if (typeof params.lenght !== "undefined") {
      if (params.length === 0) {
        return "";
      }

      let params_b = [];
      for (let p in params) {
        params_b.push(stringify_params(p));
      }

      return params_b.join(", ");
    } else if (
      typeof params.value === "number" &&
      typeof params.t === "string"
    ) {
      return unit_to_css(params);
    }
  }

  if (typeof params === "number") {
    return params.toFixed(2).toString();
  }

  return params.toString();
}

export function transform_to_css(transform: Transform): string {
  const transforms: string[] = [];
  for (const f of Transform.FUNCTIONS) {
    if (transform[f] != null) {
      transforms.push(`${f}(${stringify_params(transform[f])})`);
    } else {
    }
  }
  return transforms.join(" ");
}

export enum Direction {
  Up,
  Down,
  Left,
  Right,
}

export function direction_translate(
  direction: Direction,
  value: Unit = Unit.px(100)
): Transform {
  switch (direction) {
    case Direction.Up:
      return {
        translateY: value,
      };
    case Direction.Down:
      return {
        translateY: neg_unit(value),
      };
    case Direction.Left:
      return {
        translateX: value,
      };
    case Direction.Right:
      return {
        translateX: neg_unit(value),
      };
    default:
      break;
  }
}

export enum EasingFunction {
  ease,
  ease_in,
  ease_out,
  ease_in_out,

  ease_in_back,
  ease_out_back,
  ease_in_out_back,

  ease_in_sine,
  ease_out_sine,
  ease_in_out_sine,

  ease_in_quad,
  ease_out_quad,
  ease_in_out_quad,

  ease_in_cubic,
  ease_out_cubic,
  ease_in_out_cubic,

  ease_in_quart,
  ease_out_quart,
  ease_in_out_quart,

  linear,
}

export function easing_function_css(f: EasingFunction): string {
  switch (f) {
    case EasingFunction.ease:
      return "ease";
    case EasingFunction.ease_in:
      return "ease-in";
    case EasingFunction.ease_out:
      return "ease-out";
    case EasingFunction.ease_in_out:
      return "ease-in-out";

    case EasingFunction.ease_in_back:
      return "cubic-bezier(0.6, -0.28, 0.735, 0.045)";
    case EasingFunction.ease_out_back:
      return "cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    case EasingFunction.ease_in_out_back:
      return "cubic-bezier(0.68, -0.55, 0.265, 1.55)";

    case EasingFunction.ease_in_sine:
      return "cubic-bezier(0.47, 0, 0.745, 0.715)";
    case EasingFunction.ease_out_sine:
      return "cubic-bezier(0.39, 0.575, 0.565, 1)";
    case EasingFunction.ease_in_out_sine:
      return "cubic-bezier(0.445, 0.05, 0.55, 0.95)";

    case EasingFunction.ease_in_quad:
      return "cubic-bezier(0.55, 0.085, 0.68, 0.53)";
    case EasingFunction.ease_out_quad:
      return "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    case EasingFunction.ease_in_out_quad:
      return "cubic-bezier(0.455, 0.03, 0.515, 0.955)";

    case EasingFunction.ease_in_cubic:
      return "cubic-bezier(0.55, 0.085, 0.68, 0.53)";
    case EasingFunction.ease_out_cubic:
      return "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    case EasingFunction.ease_in_out_cubic:
      return "cubic-bezier(0.455, 0.03, 0.515, 0.955)";

    case EasingFunction.ease_in_quart:
      return "cubic-bezier(0.55, 0.085, 0.68, 0.53)";
    case EasingFunction.ease_out_quart:
      return "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    case EasingFunction.ease_in_out_quart:
      return "cubic-bezier(0.455, 0.03, 0.515, 0.955)";

    case EasingFunction.linear:
    default:
      return "linear";
  }
}
