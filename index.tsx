import {
  Color,
  Button,
  HStack,
  Navigation,
  NavigationStack,
  Script,
  Spacer,
  Text,
  Toolbar,
  ToolbarItem,
  VStack,
  useState,
} from "scripting"

type Operator = "+" | "−" | "×" | "÷"
type KeyKind = "number" | "operator" | "function" | "equals"

type CalcKey = {
  label: string
  kind: KeyKind
  wide?: boolean
}

const keys: CalcKey[][] = [
  [
    { label: "AC", kind: "function" },
    { label: "±", kind: "function" },
    { label: "%", kind: "function" },
    { label: "÷", kind: "operator" },
  ],
  [
    { label: "7", kind: "number" },
    { label: "8", kind: "number" },
    { label: "9", kind: "number" },
    { label: "×", kind: "operator" },
  ],
  [
    { label: "4", kind: "number" },
    { label: "5", kind: "number" },
    { label: "6", kind: "number" },
    { label: "−", kind: "operator" },
  ],
  [
    { label: "1", kind: "number" },
    { label: "2", kind: "number" },
    { label: "3", kind: "number" },
    { label: "+", kind: "operator" },
  ],
  [
    { label: "0", kind: "number", wide: true },
    { label: ".", kind: "number" },
    { label: "=", kind: "equals" },
  ],
]

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "错误"
  }

  const rounded = Math.abs(value) < 1e-12 ? 0 : value
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : Number(rounded.toPrecision(12)).toString()

  return text.length > 14 ? rounded.toExponential(8) : text
}

function calculate(left: number, right: number, operator: Operator): number {
  switch (operator) {
    case "+":
      return left + right
    case "−":
      return left - right
    case "×":
      return left * right
    case "÷":
      return right === 0 ? Number.NaN : left / right
  }
}

function expressionText(left: number | null, operator: Operator | null, display: string) {
  if (left === null || operator === null) {
    return "轻点数字开始计算"
  }
  return `${formatNumber(left)} ${operator} ${display}`
}

function buttonColor(kind: KeyKind, label: string): Color {
  if (kind === "operator" || kind === "equals") {
    return "#ff9f0a"
  }
  if (kind === "function") {
    return "#d4d4d2"
  }
  return "#505050"
}

function textColor(kind: KeyKind): Color {
  return kind === "function" ? "#111111" : "#ffffff"
}

function CalculatorButton(props: {
  keyInfo: CalcKey
  selected: boolean
  onTap: (label: string, kind: KeyKind) => void
}) {
  const { keyInfo, selected, onTap } = props
  const width = keyInfo.wide ? 158 : 74
  const background = selected ? "#ffffff" : buttonColor(keyInfo.kind, keyInfo.label)
  const foreground = selected ? "#ff9f0a" : textColor(keyInfo.kind)

  return (
    <Button
      action={() => onTap(keyInfo.label, keyInfo.kind)}
      buttonStyle="plain"
      frame={{ width, height: 64 }}
      background={background}
      foregroundStyle={foreground}
    >
      <Text font={30} fontWeight="semibold" monospacedDigit>
        {keyInfo.label}
      </Text>
    </Button>
  )
}

function CalculatorView() {
  const dismiss = Navigation.useDismiss()
  const [display, setDisplay] = useState("0")
  const [storedValue, setStoredValue] = useState<number | null>(null)
  const [pendingOperator, setPendingOperator] = useState<Operator | null>(null)
  const [waitingForNewNumber, setWaitingForNewNumber] = useState(false)

  function clearAll() {
    setDisplay("0")
    setStoredValue(null)
    setPendingOperator(null)
    setWaitingForNewNumber(false)
  }

  function inputNumber(label: string) {
    if (display === "错误") {
      setDisplay(label === "." ? "0." : label)
      setWaitingForNewNumber(false)
      return
    }

    if (waitingForNewNumber) {
      setDisplay(label === "." ? "0." : label)
      setWaitingForNewNumber(false)
      return
    }

    if (label === ".") {
      if (!display.includes(".")) {
        setDisplay(`${display}.`)
      }
      return
    }

    if (display === "0") {
      setDisplay(label)
    } else if (display.length < 14) {
      setDisplay(`${display}${label}`)
    }
  }

  function applyFunction(label: string) {
    if (label === "AC") {
      clearAll()
      return
    }

    const value = Number(display)
    if (!Number.isFinite(value)) {
      clearAll()
      return
    }

    if (label === "±") {
      setDisplay(formatNumber(-value))
    } else if (label === "%") {
      setDisplay(formatNumber(value / 100))
    }
  }

  function chooseOperator(label: string) {
    const operator = label as Operator
    const current = Number(display)

    if (!Number.isFinite(current)) {
      clearAll()
      return
    }

    if (storedValue !== null && pendingOperator !== null && !waitingForNewNumber) {
      const result = calculate(storedValue, current, pendingOperator)
      setDisplay(formatNumber(result))
      setStoredValue(result)
    } else {
      setStoredValue(current)
    }

    setPendingOperator(operator)
    setWaitingForNewNumber(true)
  }

  function solve() {
    const current = Number(display)
    if (storedValue === null || pendingOperator === null || !Number.isFinite(current)) {
      return
    }

    const result = calculate(storedValue, current, pendingOperator)
    setDisplay(formatNumber(result))
    setStoredValue(null)
    setPendingOperator(null)
    setWaitingForNewNumber(true)
  }

  function handleTap(label: string, kind: KeyKind) {
    if (kind === "number") {
      inputNumber(label)
    } else if (kind === "function") {
      applyFunction(label)
    } else if (kind === "operator") {
      chooseOperator(label)
    } else {
      solve()
    }
  }

  return (
    <NavigationStack>
      <VStack
        spacing={16}
        padding={{ horizontal: 18, vertical: 20 }}
        background="#1c1c1e"
        navigationTitle="计算器"
        toolbarTitleDisplayMode="inline"
        toolbar={
          <Toolbar>
            <ToolbarItem placement="topBarTrailing">
              <Button title="关闭" action={dismiss} />
            </ToolbarItem>
          </Toolbar>
        }
      >
        <Spacer />

        <VStack alignment="trailing" spacing={8} frame={{ maxWidth: "infinity" }}>
          <Text font={16} foregroundStyle="#9a9a9a" lineLimit={1} monospacedDigit>
            {expressionText(storedValue, pendingOperator, display)}
          </Text>
          <Text
            font={58}
            fontWeight="light"
            foregroundStyle="#ffffff"
            lineLimit={1}
            minScaleFactor={0.45}
            monospacedDigit
          >
            {display}
          </Text>
        </VStack>

        <VStack spacing={10}>
          {keys.map((row, rowIndex) => (
            <HStack key={rowIndex} spacing={10}>
              {row.map((keyInfo) => (
                <CalculatorButton
                  key={keyInfo.label}
                  keyInfo={keyInfo}
                  selected={pendingOperator === keyInfo.label && waitingForNewNumber}
                  onTap={handleTap}
                />
              ))}
            </HStack>
          ))}
        </VStack>
      </VStack>
    </NavigationStack>
  )
}

export default CalculatorView

async function run() {
  await Navigation.present(<CalculatorView />)
  Script.exit()
}

run()
